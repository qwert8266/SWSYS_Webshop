package handlers

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"github.com/qwert8266/SWSYS_Webshop/server/services"
	"go.mongodb.org/mongo-driver/v2/bson"
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

	now := (time.Now().UTC()).Format("2006-01-02 15:04")
	referenceNumber := generateContactReferenceNumber(now)

	contactName := resolveContactName(c)

	contactRequest := models.ContactRequest{
		ID:              uuid.New(),
		ReferenceNumber: referenceNumber,
		Reason:          validRequest.Reason,
		Description:     validRequest.Description,
		Name:            contactName,
		Email:           validRequest.Email,
		Phone:           validRequest.Phone,
		Status:          "offen",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// Kontaktanfrage in der Datenbank speichern
	if _, err := config.ContactRequestCollection().InsertOne(c.Request.Context(), contactRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kontaktanfrage konnte nicht gespeichert werden."})
		return
	}

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

func generateContactReferenceNumber(now string) string {

	var letterBytes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	randomPart := make([]byte, 4)
	for i := range randomPart {
		randomPart[i] = letterBytes[rand.Intn(len(letterBytes))]
	}

	return fmt.Sprintf("REF-%s-%v", now, randomPart) //strings.ToUpper()
}

func resolveContactName(c *gin.Context) string {
	const guestName = "Gast"

	authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
	if authHeader == "" {
		return guestName
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if token == "" || token == authHeader {
		return guestName
	}

	claims, err := helpers.ValidateToken(token, config.JWTSecret(), helpers.AccessTokenType)
	if err != nil {
		return guestName
	}

	var user models.User
	err = config.UserCollection().FindOne(
		c.Request.Context(),
		bson.M{"id": claims.UserID},
	).Decode(&user)
	if err != nil {
		return guestName
	}

	name := contactNameFrom(user)
	if name == "" {
		return guestName
	}

	return name
}

func contactNameFrom(user models.User) string {
	firstName := strings.TrimSpace(user.FirstName)
	lastName := strings.TrimSpace(user.LastName)
	fullName := strings.TrimSpace(firstName + " " + lastName)
	if fullName != "" {
		return fullName
	}

	companyName := strings.TrimSpace(user.CompanyName)
	if companyName != "" {
		return companyName
	}
	return ""
}

func GetContactRequests(c *gin.Context) {
	contactRequestCollection := config.ContactRequestCollection()

	cursor, err := contactRequestCollection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var contactRequests []models.ContactRequest

	if err = cursor.All(c.Request.Context(), &contactRequests); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, contactRequests)
}
