package handlers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"github.com/qwert8266/SWSYS_Webshop/server/services"
)

func SubmitContactRequest(c *gin.Context) {
	var request models.ContactFormRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kontaktanfrage konnte nicht verarbeitet werden"})
		return
	}

	validRequest, err := validContactRequest(request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now().UTC()
	now.Format("Datetime")
	referenceNumber := generateContactReferenceNumber(now)

	contactRequest := models.ContactRequest{
		ID:              uuid.New(),
		ReferenceNumber: referenceNumber,
		Reason:          validRequest.Reason,
		Description:     validRequest.Description,
		Name:            validRequest.Name,
		Email:           validRequest.Email,
		Phone:           validRequest.Phone,
		Status:          "offen",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// Kontaktanfrage in der Datenbank speichern

	if err := services.SendContactRequestEmployeeEmail(contactRequest); err != nil {
		log.Printf("Mitarbeiter-Email für %s konnte nicht gesendet werden: %v", referenceNumber, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Mitarbeiter-Email mit der Kontaktanfrage konnte nicht gesendet werden."})
		return
	}

	if err := services.SendContactRequestConfirmationEmail(contactRequest); err != nil {
		log.Printf("Bestätigungs-Email für %s konnte nicht gesendet werden: %v", referenceNumber, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bestätigungs-Email der Kontaktanfrage konnte nicht gesendet werden."})
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Die Kontaktanfrage wurde erolgreich abgesendet und wird in kürze von einem Mitarbeiter bearbeitet."})
	// Die Kontaktanfrage ist erolgreich bei uns eingegangen und wird in kürze von einem Mitarbeiter bearbeitet. Wir melden uns bei Ihnen? ...
}

func validContactRequest(request models.ContactFormRequest) (models.ContactFormRequest, error) {
	validRequest := models.ContactFormRequest{
		Reason:      strings.TrimSpace(request.Reason),
		Description: strings.TrimSpace(request.Description),
		Name:        strings.TrimSpace(request.Name),
		Email:       strings.TrimSpace(request.Email),
		Phone:       strings.TrimSpace(request.Phone),
	}

	if validRequest.Reason == "" || validRequest.Reason == "Bitte auswählen..." {
		return validRequest, errors.New("Bitte wählen Sie den Grund Anliegens aus.")
	}

	if len(validRequest.Description) < 10 {
		return validRequest, errors.New("Bitte beschrieben Sie Ihr Anliegen mit mindestens 10 Zeichen.")
	}

	if validRequest.Email == "" {
		return validRequest, errors.New("E-Mail-Adresse ist erforderlich.")
	}

	if _, err := mail.ParseAddress(validRequest.Email); err != nil {
		return validRequest, errors.New("Bitte geben Sie eine gültige E-Mail-Adresse an.")
	}

	return validRequest, nil
}

func generateContactReferenceNumber(now time.Time) string {
	dateStr := now.Format(time.DateTime)
	randomPart := make([]byte, 4)

	return fmt.Sprintf("REF-%s-%s", dateStr, randomPart) //strings.ToUpper()
}
