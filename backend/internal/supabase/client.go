package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const adminAccessTable = "admin_portal_access"

type Client struct {
	URL        string
	ServiceKey string
	AnonKey    string
	HTTP       *http.Client
}

type AdminAccess struct {
	Email  string `json:"email"`
	Active bool   `json:"active"`
	Role   string `json:"role"`
}

func NewFromEnv() Client {
	return Client{
		URL:        strings.TrimRight(os.Getenv("SUPABASE_URL"), "/"),
		ServiceKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		AnonKey:    os.Getenv("SUPABASE_ANON_KEY"),
		HTTP:       &http.Client{Timeout: 5 * time.Second},
	}
}

func (c Client) configured() bool {
	return strings.HasPrefix(c.URL, "http") && strings.TrimSpace(c.ServiceKey) != "" && c.ServiceKey != "replace-me"
}

func (c Client) AuthConfigured() bool {
	return strings.HasPrefix(c.URL, "http") && strings.TrimSpace(c.AnonKey) != "" && c.AnonKey != "replace-me"
}

func (c Client) VerifyPasswordLogin(ctx context.Context, identifier, password string) error {
	if !c.AuthConfigured() {
		return errors.New("supabase auth is not configured")
	}
	if !strings.Contains(identifier, "@") {
		return errors.New("phone login requires a configured OTP/phone provider")
	}
	body, _ := json.Marshal(map[string]string{"email": strings.TrimSpace(strings.ToLower(identifier)), "password": password})
	endpoint := c.URL + "/auth/v1/token?grant_type=password"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", c.AnonKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("supabase auth rejected credentials")
	}
	return nil
}

func (c Client) IsAdminEmail(ctx context.Context, email string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return false, nil
	}
	if c.configured() {
		endpoint := c.URL + "/rest/v1/" + adminAccessTable + "?select=email,active,role&email=eq." + url.QueryEscape(email) + "&active=eq.true&limit=1"
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
		if err != nil {
			return false, err
		}
		req.Header.Set("apikey", c.ServiceKey)
		req.Header.Set("Authorization", "Bearer "+c.ServiceKey)
		req.Header.Set("Accept", "application/json")
		resp, err := c.HTTP.Do(req)
		if err != nil {
			return false, err
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return false, errors.New("supabase admin access lookup failed")
		}
		var rows []AdminAccess
		if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
			return false, err
		}
		return len(rows) > 0, nil
	}
	return false, nil
}

func (c Client) DataConfigured() bool { return c.configured() }

func (c Client) Select(ctx context.Context, table string, selectExpr string, filters map[string]string, limit int) ([]map[string]any, error) {
	if !c.configured() {
		return []map[string]any{}, nil
	}
	if selectExpr == "" {
		selectExpr = "*"
	}
	endpoint, err := url.Parse(c.URL + "/rest/v1/" + table)
	if err != nil {
		return nil, err
	}
	query := endpoint.Query()
	query.Set("select", selectExpr)
	if limit > 0 {
		query.Set("limit", strconv.Itoa(limit))
	}
	for key, value := range filters {
		query.Set(key, value)
	}
	endpoint.RawQuery = query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", c.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+c.ServiceKey)
	req.Header.Set("Accept", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("supabase data read failed")
	}
	var rows []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (c Client) Insert(ctx context.Context, table string, row map[string]any) error {
	if !c.configured() {
		return nil
	}
	body, err := json.Marshal(row)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.URL+"/rest/v1/"+table, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", c.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+c.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("supabase data write failed")
	}
	return nil
}
