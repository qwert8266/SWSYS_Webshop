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

	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.deanishe.net/env"
)

// Die Template-Dateien werden in das Go-Binary eingebettet
//
//go:embed templates/password-reset-email.tmpl templates/password-reset-email.css templates/contact-confirmation-email.tmpl templates/contact-email.css templates/contact-employee-email.tmpl
var emailTemplateFiles embed.FS

type MailConfig struct {
	Host                 string
	Port                 string
	Username             string
	Password             string
	FromName             string
	FromAddress          string
	ContactEmployeeEmail string
	CompanyLogoPath      string
}

type PasswortResetTemplateData struct {
	Username string
	ResetURL string
	Year     int
	CSS      template.CSS
}

type ContactConfirmationTemplateData struct {
	Username        string
	ReferenceNumber string
	Reason          string
	Year            int
	CSS             template.CSS
	CompanyLogo     template.URL
}

type ContactEmployeeTemplateData struct {
	ReferenceNumber string
	Reason          string
	Description     string
	Name            string
	Email           string
	Phone           string
	CreatedAt       string
	Year            int
	CSS             template.CSS
	CompanyLogo     template.URL
}

func LoadMailConfig() MailConfig {
	return MailConfig{
		Host:                 os.Getenv("SMTP_HOST"),
		Port:                 os.Getenv("SMTP_PORT"),
		Username:             strings.TrimSpace(env.Get("SMTP_USERNAME")),
		Password:             env.Get("SMTP_PASSWORD"),
		FromName:             "Schmidt+Söhne-Getränkemarkt",
		FromAddress:          "no-reply@schmidt-soehne.de",
		ContactEmployeeEmail: "kontakt@schmidt-soehne.de",
		CompanyLogoPath:      "/images/companyLogo.png",
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
		return fmt.Errorf("absender Email-Adresse ist nicht gesetzt")
	}

	if _, err := mail.ParseAddress(config.FromAddress); err != nil {
		return fmt.Errorf("absender Email-Adresse ist ungültig: %w", err)
	}
	if _, err := mail.ParseAddress(to); err != nil {
		return fmt.Errorf("die Empfänger Email-Adresse ist ungültig: %w", err)
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

func SendPasswordResetEmail(recipientName, recipientAddress, resetURL string) error {
	config := LoadMailConfig()

	subject := "Passwort zurücksetzen"
	htmlBody, err := buildPasswordResetHTML(recipientName, resetURL)
	if err != nil {
		return err
	}

	return sendHTMLMail(config, recipientAddress, subject, htmlBody)
}

func SendContactRequestConfirmationEmail(contactRequest models.ContactRequest) error {
	config := LoadMailConfig()

	subject := fmt.Sprintf("Kontaktanfrage eingegangen: %s", contactRequest.ReferenceNumber)
	htmlBody, err := buildContactConfirmationHTML(config, contactRequest)
	if err != nil {
		return err
	}

	return sendHTMLMail(config, contactRequest.Email, subject, htmlBody)
}

func SendContactRequestEmployeeEmail(contactRequest models.ContactRequest) error {
	config := LoadMailConfig()

	subject := fmt.Sprintf("Neue Kontaktanfrage: %s", contactRequest.ReferenceNumber)
	htmlBody, err := buildContactEmployeeHTML(config, contactRequest)
	if err != nil {
		return err
	}

	return sendHTMLMail(config, config.ContactEmployeeEmail, subject, htmlBody)
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
		CSS:      template.CSS(cssBytes),
	}

	var body bytes.Buffer
	if err := templ.Execute(&body, data); err != nil {
		return "", fmt.Errorf("HTML-Template für Passwort-Reset-Mail konnte nicht gerendert werden: %w", err)
	}

	return body.String(), nil
}

func buildContactConfirmationHTML(config MailConfig, contactRequest models.ContactRequest) (string, error) {
	cssBytes, err := emailTemplateFiles.ReadFile("templates/contact-email.css")
	if err != nil {
		return "", fmt.Errorf("CSS-Datei konnte nicht gelesen werden: %w", err)
	}

	templ, err := template.ParseFS(emailTemplateFiles, "templates/contact-confirmation-email.tmpl")
	if err != nil {
		return "", fmt.Errorf("HTML-Telpate für Contact-Confirmation-Mail konnte nicht geladen werden: %w", err)
	}

	name := strings.TrimSpace(contactRequest.Name)
	if name == "" {
		name = "Kunde"
	}

	data := ContactConfirmationTemplateData{
		Username:        name,
		ReferenceNumber: contactRequest.ReferenceNumber,
		Reason:          contactRequest.Reason,
		Year:            time.Now().Year(),
		CSS:             template.CSS(string(cssBytes)),
		CompanyLogo:     template.URL(config.CompanyLogoPath),
	}

	var body bytes.Buffer
	if err := templ.Execute(&body, data); err != nil {
		return "", fmt.Errorf("HTML-Template für Contact-Confirm-Mail konnte nicht gerendert werden: %w", err)
	}

	return body.String(), nil

}

func buildContactEmployeeHTML(config MailConfig, contactRequest models.ContactRequest) (string, error) {
	cssBytes, err := emailTemplateFiles.ReadFile("templates/contact-email.css")
	if err != nil {
		return "", fmt.Errorf("CSS-Datei konnte nicht gelesen werden: %w", err)
	}

	templ, err := template.ParseFS(emailTemplateFiles, "templates/contact-employee-email.tmpl")
	if err != nil {
		return "", fmt.Errorf("HTML-Telpate für Contact-Employee-Mail konnte nicht geladen werden: %w", err)
	}

	name := strings.TrimSpace(contactRequest.Name)
	if name == "" {
		name = "Gast"
	}

	phone := strings.TrimSpace(contactRequest.Phone)
	if phone == "" {
		phone = "Nicht angegeben"
	}

	data := ContactEmployeeTemplateData{
		ReferenceNumber: contactRequest.ReferenceNumber,
		Reason:          contactRequest.Reason,
		Description:     contactRequest.Description,
		Name:            name,
		Email:           contactRequest.Email,
		Phone:           phone,
		CreatedAt:       contactRequest.CreatedAt,
		Year:            time.Now().Year(),
		CSS:             template.CSS(string(cssBytes)),
		CompanyLogo:     template.URL(config.CompanyLogoPath),
	}

	var body bytes.Buffer
	if err := templ.Execute(&body, data); err != nil {
		return "", fmt.Errorf("HTML-Template für Contact-Employee-Mail konnte nicht gerendert werden: %w", err)
	}

	return body.String(), nil
}
