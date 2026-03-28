package channel

import (
	"crypto/tls"
	"fmt"
	"log/slog"
	"net/smtp"
	"strings"
	"time"

	"github.com/manacore/mana-notify/internal/config"
)

type EmailService struct {
	host     string
	port     int
	user     string
	password string
	from     string
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		user:     cfg.SMTPUser,
		password: cfg.SMTPPassword,
		from:     cfg.SMTPFrom,
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
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("From: %s\r\n", from))
	builder.WriteString(fmt.Sprintf("To: %s\r\n", msg.To))
	builder.WriteString(fmt.Sprintf("Subject: %s\r\n", msg.Subject))
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

	// Extract email from "Name <email@example.com>" format
	fromAddr := extractEmail(from)
	addr := fmt.Sprintf("%s:%d", s.host, s.port)

	auth := smtp.PlainAuth("", s.user, s.password, s.host)

	tlsConfig := &tls.Config{ServerName: s.host}
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		// Try STARTTLS fallback
		err = smtp.SendMail(addr, auth, fromAddr, []string{msg.To}, []byte(builder.String()))
		if err != nil {
			slog.Error("email send failed", "to", msg.To, "error", err, "duration", time.Since(start))
			return EmailResult{Success: false, Error: err.Error()}
		}
		slog.Info("email sent via STARTTLS", "to", msg.To, "duration", time.Since(start))
		return EmailResult{Success: true}
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	defer client.Close()

	if err := client.Auth(auth); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}

	if err := client.Mail(fromAddr); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := client.Rcpt(msg.To); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}

	w, err := client.Data()
	if err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if _, err := w.Write([]byte(builder.String())); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}
	if err := w.Close(); err != nil {
		return EmailResult{Success: false, Error: err.Error()}
	}

	client.Quit()

	slog.Info("email sent", "to", msg.To, "duration", time.Since(start))
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
