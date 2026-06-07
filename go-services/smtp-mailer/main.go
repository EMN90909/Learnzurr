package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type sendRequest struct {
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
	ReplyTo string   `json:"replyTo"`
}

type jsonResponse struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func clean(value string, max int) string {
	value = strings.TrimSpace(value)
	value = strings.Map(func(r rune) rune {
		if r < 32 && r != '\n' && r != '\t' {
			return -1
		}
		return r
	}, value)
	if len(value) > max {
		return value[:max]
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, payload jsonResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func sendSMTP(req sendRequest) error {
	host := env("SMTP_HOST", "")
	user := env("SMTP_USER", "")
	pass := env("SMTP_PASS", "")
	from := env("SMTP_FROM", "")
	fromName := env("SMTP_FROM_NAME", "Struta")
	port := env("SMTP_PORT", "587")
	secure, _ := strconv.ParseBool(env("SMTP_SECURE", "false"))
	if host == "" || user == "" || pass == "" || from == "" {
		return fmt.Errorf("SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM are required")
	}
	if _, err := mail.ParseAddress(from); err != nil {
		return fmt.Errorf("invalid SMTP_FROM: %w", err)
	}
	validTo := make([]string, 0, len(req.To))
	for _, recipient := range req.To {
		recipient = clean(recipient, 180)
		if _, err := mail.ParseAddress(recipient); err == nil {
			validTo = append(validTo, recipient)
		}
	}
	if len(validTo) == 0 {
		return fmt.Errorf("at least one valid recipient is required")
	}
	subject := strings.ReplaceAll(clean(req.Subject, 180), "\n", " ")
	html := clean(req.HTML, 100000)
	text := clean(req.Text, 10000)
	if subject == "" || html == "" {
		return fmt.Errorf("subject and html are required")
	}
	boundary := fmt.Sprintf("struta-%d", time.Now().UnixNano())
	fromHeader := (&mail.Address{Name: fromName, Address: from}).String()
	headers := []string{
		"From: " + fromHeader,
		"To: " + strings.Join(validTo, ", "),
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: multipart/alternative; boundary=" + boundary,
	}
	if req.ReplyTo != "" {
		if _, err := mail.ParseAddress(req.ReplyTo); err == nil {
			headers = append(headers, "Reply-To: "+req.ReplyTo)
		}
	}
	message := strings.Join(headers, "\r\n") + "\r\n\r\n" +
		"--" + boundary + "\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n" + text + "\r\n" +
		"--" + boundary + "\r\nContent-Type: text/html; charset=utf-8\r\n\r\n" + html + "\r\n" +
		"--" + boundary + "--\r\n"
	addr := host + ":" + port
	auth := smtp.PlainAuth("", user, pass, host)
	if secure {
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host, MinVersion: tls.VersionTLS12})
		if err != nil {
			return err
		}
		client, err := smtp.NewClient(conn, host)
		if err != nil {
			return err
		}
		defer client.Quit()
		if err := client.Auth(auth); err != nil {
			return err
		}
		if err := client.Mail(from); err != nil {
			return err
		}
		for _, recipient := range validTo {
			if err := client.Rcpt(recipient); err != nil {
				return err
			}
		}
		writer, err := client.Data()
		if err != nil {
			return err
		}
		if _, err := writer.Write([]byte(message)); err != nil {
			return err
		}
		return writer.Close()
	}
	return smtp.SendMail(addr, auth, from, validTo, []byte(message))
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{OK: false, Error: "Method not allowed"})
		return
	}
	if r.ContentLength > 1_000_000 {
		writeJSON(w, http.StatusRequestEntityTooLarge, jsonResponse{OK: false, Error: "Request is too large"})
		return
	}
	var req sendRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1_000_000)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{OK: false, Error: "Invalid JSON"})
		return
	}
	if err := sendSMTP(req); err != nil {
		writeJSON(w, http.StatusBadGateway, jsonResponse{OK: false, Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{OK: true})
}

func main() {
	_ = godotenv.Load()
	mux := http.NewServeMux()
	mux.HandleFunc("/send", sendHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, http.StatusOK, jsonResponse{OK: true}) })
	port := env("SMTP_GO_PORT", env("PORT", "8092"))
	log.Printf("Struta Go SMTP mailer listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
