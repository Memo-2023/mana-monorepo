package db

import "time"

type Notification struct {
	ID           string     `json:"id"`
	UserID       *string    `json:"userId,omitempty"`
	AppID        string     `json:"appId"`
	Channel      string     `json:"channel"`
	TemplateID   *string    `json:"templateId,omitempty"`
	Subject      *string    `json:"subject,omitempty"`
	Body         *string    `json:"body,omitempty"`
	Data         []byte     `json:"data,omitempty"` // JSONB
	Status       string     `json:"status"`
	Priority     string     `json:"priority"`
	ScheduledFor *time.Time `json:"scheduledFor,omitempty"`
	Recipient    *string    `json:"recipient,omitempty"`
	ExternalID   *string    `json:"externalId,omitempty"`
	Attempts     int        `json:"attempts"`
	DeliveredAt  *time.Time `json:"deliveredAt,omitempty"`
	ErrorMessage *string    `json:"errorMessage,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type Template struct {
	ID           string    `json:"id"`
	Slug         string    `json:"slug"`
	AppID        *string   `json:"appId,omitempty"`
	Channel      string    `json:"channel"`
	Subject      *string   `json:"subject,omitempty"`
	BodyTemplate string    `json:"bodyTemplate"`
	Locale       string    `json:"locale"`
	IsActive     bool      `json:"isActive"`
	IsSystem     bool      `json:"isSystem"`
	Variables    []byte    `json:"variables,omitempty"` // JSONB
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Device struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	PushToken  string     `json:"pushToken"`
	TokenType  string     `json:"tokenType"`
	Platform   *string    `json:"platform,omitempty"`
	DeviceName *string    `json:"deviceName,omitempty"`
	AppID      *string    `json:"appId,omitempty"`
	IsActive   bool       `json:"isActive"`
	LastSeenAt *time.Time `json:"lastSeenAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

type Preference struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"userId"`
	EmailEnabled          bool      `json:"emailEnabled"`
	PushEnabled           bool      `json:"pushEnabled"`
	QuietHoursEnabled     bool      `json:"quietHoursEnabled"`
	QuietHoursStart       *string   `json:"quietHoursStart,omitempty"`
	QuietHoursEnd         *string   `json:"quietHoursEnd,omitempty"`
	Timezone              string    `json:"timezone"`
	CategoryPreferences   []byte    `json:"categoryPreferences,omitempty"` // JSONB
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type DeliveryLog struct {
	ID             string    `json:"id"`
	NotificationID string    `json:"notificationId"`
	AttemptNumber  int       `json:"attemptNumber"`
	Channel        string    `json:"channel"`
	Success        bool      `json:"success"`
	StatusCode     *int      `json:"statusCode,omitempty"`
	ErrorMessage   *string   `json:"errorMessage,omitempty"`
	ProviderID     *string   `json:"providerId,omitempty"`
	DurationMs     *int      `json:"durationMs,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}
