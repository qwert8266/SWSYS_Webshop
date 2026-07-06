package services

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"strings"
	"time"

	"go.deanishe.net/env"
)

// Die Template-Dateien werden in das Go-Binary eingebettet
//
//go:embed templates/password-reset-email.tmpl templates/password-reset-email.css
var emailTemplateFiles embed.FS

type MailConfig struct {
	Enabled     bool
	Host        string
	Port        string
	Username    string
	Password    string
	FromName    string
	FromAddress string
}

type PasswortResetTemplateData struct {
	Username string
	ResetURL string
	Year     int
	CSS      template.CSS
}

func LoadMailConfig() MailConfig {
	return MailConfig{
		Enabled:     true,
		Host:        os.Getenv("SMTP_HOST"),
		Port:        os.Getenv("SMTP_PORT"),
		Username:    strings.TrimSpace(env.Get("SMTP_USERNAME")),
		Password:    env.Get("SMTP_PASSWORD"),
		FromName:    "Schmidt+Söhne-Getränkemarkt",
		FromAddress: "no-reply@schmidt.soehne.de",
	}
}

func sendHTMLMail(config MailConfig, to string, subject string, htmlBody string) error {
	if config.Host == "" {
		return fmt.Errorf("SMTP_HOST ist nicht gesetzt")
	}
	if config.Port == "" {
		return fmt.Errorf("SMTP_PORT ist ungültig")
	}
	if config.FromAddress == "" {
		return fmt.Errorf("Absender Email-Adresse ist nicht gesetzt")
	}

	if _, err := mail.ParseAddress(config.FromAddress); err != nil {
		return fmt.Errorf("Absender Email-Adresse ist ungültig: %w", err)
	}
	if _, err := mail.ParseAddress(to); err != nil {
		return fmt.Errorf("Die Empfänger Email-Adresse ist ungültig: %w", err)
	}

	fromHeader := mail.Address{Name: config.FromName, Address: config.FromAddress}
	message := buildHTMLMessage(fromHeader.String(), to, subject, htmlBody)

	address := net.JoinHostPort(config.Host, config.Port)

	err := smtp.SendMail(address, nil, config.FromAddress, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("E-Mail konnte nicht per SMTP gesendet werden: %w", err)
	}

	return nil
}

func buildHTMLMessage(from, to, subject, htmlBody string) string {
	encodedSubject := mime.QEncoding.Encode("UTF-8", subject)

	return strings.Join([]string{
		"From: " + from,
		"To: " + to,
		"Subject: " + encodedSubject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=\"UTF-8\"",
		"",
		htmlBody,
	}, "\r\n")

}

func SendPasswordResetEmail(recipientName, recipientAddress, resetURL string) error {
	config := LoadMailConfig()

	subject := "Passwort zurücksetzen"
	htmlBody, err := buildPasswordResetHTML(recipientName, resetURL)
	if err != nil {
		return err
	}

	return sendHTMLMail(config, recipientAddress, subject, htmlBody)
}

func buildPasswordResetHTML(recipientName, resetURL string) (string, error) {
	cssBytes, err := emailTemplateFiles.ReadFile("templates/password-reset-email.css")
	if err != nil {
		return "", fmt.Errorf("CSS-Datei konnte nicht gelesen werden: %w", err)
	}

	templ, err := template.ParseFS(emailTemplateFiles, "templates/password-reset-email.tmpl")
	if err != nil {
		return "", fmt.Errorf("HTML-Telpate für Passwort-Reset-Mail konnte nicht geladen werden: %w", err)
	}

	data := PasswortResetTemplateData{
		Username: recipientName,
		ResetURL: resetURL,
		Year:     time.Now().Year(),
		CSS:      template.CSS(string(cssBytes)),
	}

	var body bytes.Buffer
	if err := templ.Execute(&body, data); err != nil {
		return "", fmt.Errorf("HTML-Template für Passwort-Reset-Mail konnte nicht geladen werden: %w", err)
	}

	return body.String(), nil
}
