package services

import (
	"context"
	"fmt"
	"log/slog"
)

// CreditClient handles credit balance and consumption via mana-auth.
type CreditClient struct {
	backend *BackendClient
}

// CreditBalance holds a user's credit balance.
type CreditBalance struct {
	Balance float64 `json:"balance"`
	Used    float64 `json:"used"`
}

// NewCreditClient creates a new credit service client.
func NewCreditClient(authURL, serviceKey string) *CreditClient {
	client := NewBackendClient(authURL)
	// Service key is used for internal API calls
	_ = serviceKey
	return &CreditClient{backend: client}
}

// GetBalance returns the user's current credit balance.
func (c *CreditClient) GetBalance(ctx context.Context, token string) (*CreditBalance, error) {
	var balance CreditBalance
	if err := c.backend.Get(ctx, "/api/v1/credits/balance", token, &balance); err != nil {
		return nil, fmt.Errorf("get balance: %w", err)
	}
	return &balance, nil
}

// Consume deducts credits for an operation.
func (c *CreditClient) Consume(ctx context.Context, token string, amount float64, description string) error {
	body := map[string]any{
		"amount":      amount,
		"description": description,
	}
	if err := c.backend.Post(ctx, "/api/v1/credits/use", token, body, nil); err != nil {
		return fmt.Errorf("consume credits: %w", err)
	}
	return nil
}

// HasEnough checks if the user has enough credits for an operation.
func (c *CreditClient) HasEnough(ctx context.Context, token string, required float64) (bool, float64) {
	balance, err := c.GetBalance(ctx, token)
	if err != nil {
		slog.Debug("credit check failed", "error", err)
		return true, 0 // Allow on error (fail open)
	}
	return balance.Balance >= required, balance.Balance
}

// FormatBalance returns a formatted credit balance string.
func FormatBalance(balance float64) string {
	return fmt.Sprintf("%.2f", balance)
}
