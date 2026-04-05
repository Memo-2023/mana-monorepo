package channel

import (
	"crypto/tls"
	"fmt"
	"log/slog"
	"net/smtp"
	"strings"
	"time"

	"github.com/mana/mana-notify/internal/config"
)

type EmailService struct {
	host        string
	port        int
	user        string
	password    string
	from        string
	insecureTLS bool
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		host:        cfg.SMTPHost,
		port:        cfg.SMTPPort,
		user:        cfg.SMTPUser,
		password:    cfg.SMTPPassword,
		from:        cfg.SMTPFrom,
		insecureTLS: cfg.SMTPInsecureTLS,
	}
}

type EmailMessage struct {
	To      string
	Subject string
	HTML    string
	Text    string
	From    string
	ReplyTo string
}

type EmailResult struct {
	Success   bool
	MessageID string
	Error     string
}

// loginAuth implements smtp.Auth for LOGIN mechanism (some servers need this).
// Also bypasses Go's PlainAuth hostname check for internal connections.
type loginAuth struct {
	username, password string
}

func (a *loginAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	return "LOGIN", []byte(a.username), nil
}

func (a *loginAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		prompt := strings.TrimSpace(string(fromServer))
		switch strings.ToLower(prompt) {
		case "username:":
			return []byte(a.username), nil
		case "password:":
			return []byte(a.password), nil
		default:
			return nil, fmt.Errorf("unexpected server prompt: %s", prompt)
		}
	}
	return nil, nil
}

func (s *EmailService) IsConfigured() bool {
	return s.user != "" && s.password != ""
}

func (s *EmailService) Send(msg *EmailMessage) EmailResult {
	start := time.Now()

	if !s.IsConfigured() {
		slog.Warn("smtp not configured, skipping email", "to", msg.To)
		return EmailResult{Success: false, Error: "SMTP not configured"}
	}

	from := s.from
	if msg.From != "" {
		from = msg.From
	}

	// Build email headers and body
	msgID := fmt.Sprintf("<%d.%s@mana.how>", time.Now().UnixNano(), msg.To)

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("From: %s\r\n", from))
	builder.WriteString(fmt.Sprintf("To: %s\r\n", msg.To))
	builder.WriteString(fmt.Sprintf("Subject: %s\r\n", msg.Subject))
	builder.WriteString(fmt.Sprintf("Message-ID: %s\r\n", msgID))
	builder.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().UTC().Format(time.RFC1123Z)))
	if msg.ReplyTo != "" {
		builder.WriteString(fmt.Sprintf("Reply-To: %s\r\n", msg.ReplyTo))
	}
	builder.WriteString("MIME-Version: 1.0\r\n")
	builder.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	builder.WriteString("\r\n")

	if msg.HTML != "" {
		builder.WriteString(msg.HTML)
	} else {
		builder.WriteString(msg.Text)
	}

	fromAddr := extractEmail(from)
	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	body := []byte(builder.String())

	tlsConfig := &tls.Config{ServerName: s.host, InsecureSkipVerify: s.insecureTLS}

	// Try implicit TLS first (port 465 style)
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err == nil {
		defer conn.Close()
		result := s.sendViaClient(conn, s.host, fromAddr, msg.To, body, start)
		if result.Success {
			slog.Info("email sent via TLS", "to", msg.To, "duration", time.Since(start))
		}
		return result
	}

	// Fallback: STARTTLS on plain connection
	c, dialErr := smtp.Dial(addr)
	if dialErr != nil {
		slog.Error("smtp dial failed", "to", msg.To, "error", dialErr, "duration", time.Since(start))
		return EmailResult{Success: false, Error: dialErr.Error()}
	}
	defer c.Close()

	// Try STARTTLS
	if err := c.StartTLS(tlsConfig); err != nil {
		if s.insecureTLS {
			slog.Warn("STARTTLS failed, continuing without TLS", "error", err)
		} else {
			slog.Error("STARTTLS failed", "to", msg.To, "error", err)
			return EmailResult{Success: false, Error: err.Error()}
		}
	}

	// Auth — use loginAuth to bypass Go's PlainAuth hostname restriction
	auth := &loginAuth{username: s.user, password: s.password}
	if err := c.Auth(auth); err != nil {
		slog.Error("smtp auth failed", "to", msg.To, "error", err, "duration", time.Since(start))
		return EmailResult{Success: false, Error: err.Error()}
	}

	if err := c.Mail(fromAddr); err != nil {
		slog.Error("smtp MAIL FROM failed", "to", msg.To, "error", err)
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := c.Rcpt(msg.To); err != nil {
		slog.Error("smtp RCPT TO failed", "to", msg.To, "error", err)
		return EmailResult{Success: false, Error: err.Error()}
	}

	w, err := c.Data()
	if err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if _, err := w.Write(body); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := w.Close(); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	c.Quit()

	slog.Info("email sent via STARTTLS", "to", msg.To, "duration", time.Since(start))
	return EmailResult{Success: true}
}

func (s *EmailService) sendViaClient(conn *tls.Conn, host string, from, to string, body []byte, start time.Time) EmailResult {
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	defer client.Close()

	auth := &loginAuth{username: s.user, password: s.password}
	if err := client.Auth(auth); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := client.Mail(from); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := client.Rcpt(to); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	w, err := client.Data()
	if err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if _, err := w.Write(body); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := w.Close(); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	client.Quit()
	return EmailResult{Success: true}
}

func extractEmail(from string) string {
	if idx := strings.Index(from, "<"); idx != -1 {
		end := strings.Index(from, ">")
		if end > idx {
			return from[idx+1 : end]
		}
	}
	return from
}
