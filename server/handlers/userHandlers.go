package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

var users = config.NewUserCollection(config.DB)

func GetUsers(c *gin.Context) {
	cursor, err := users.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var users []models.User

	if err = cursor.All(c.Request.Context(), &users); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, users)
}

func GetUserByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var user models.User

	err = users.FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "requested user not found"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.IndentedJSON(http.StatusOK, user)
}

func AddNewUser(c *gin.Context) {
	var incomingUserData models.RegisterRequest

	// the incoming JSON is parsed into newUser
	if err := c.BindJSON(&incomingUserData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user data": err.Error()})
		return
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(incomingUserData.Email))
	incomingUserData.CustomerType = strings.TrimSpace(incomingUserData.CustomerType)

	if normalizedEmail == "" || len(incomingUserData.Password) < 8 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "E-Mail und Passwort mit mindestens 8 Zeichen sind erforderlich."})
		return
	}

	if incomingUserData.CustomerType != "private" && incomingUserData.CustomerType != "business" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Ungüliger Kundentyp."})
		return
	}

	if strings.TrimSpace(incomingUserData.FirstName) == "" || strings.TrimSpace(incomingUserData.LastName) == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Vorname und Nachname sind erforderlich."})
		return
	}

	if incomingUserData.CustomerType == "business" && strings.TrimSpace(incomingUserData.CompanyName) == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Für ein Geschäftskonto ist der Unternehmensname erforderlich."})
		return
	}

	err := users.FindOne(c.Request.Context(), bson.M{"email": normalizedEmail}).Err()
	if err == nil {
		c.IndentedJSON(http.StatusConflict, gin.H{"error": "Diese E-Mail-Adresse ist bereits registriert."})
		return
	}
	if !errors.Is(err, mongo.ErrNoDocuments) {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(incomingUserData.Password), bcrypt.DefaultCost)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Password konnte nicht verarbeitet werden."})
	}

	// a new UUID is created for the new user
	newUser := models.User{
		ID:           uuid.New(),
		CustomerType: incomingUserData.CustomerType,
		Salutation:   strings.TrimSpace(incomingUserData.Salutation),
		FirstName:    strings.TrimSpace(incomingUserData.FirstName),
		LastName:     strings.TrimSpace(incomingUserData.LastName),
		BirthDate:    strings.TrimSpace(incomingUserData.BirthDate),
		Phone:        strings.TrimSpace(incomingUserData.Phone),
		CompanyName:  strings.TrimSpace(incomingUserData.CompanyName),

		Email:        normalizedEmail,
		PasswordHash: string(passwordHash),
		Address: models.Address{
			Street:      strings.TrimSpace(incomingUserData.Street),
			HouseNumber: strings.TrimSpace(incomingUserData.HouseNumber),
			ZipCode:     strings.TrimSpace(incomingUserData.ZipCode),
			City:        strings.TrimSpace(incomingUserData.City),
			Country:     strings.TrimSpace(incomingUserData.Country),
		},
	}

	// the new movie is added to the list of movies
	if _, err := users.InsertOne(c.Request.Context(), newUser); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusCreated, newUser.ID)
}

func DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user id": err.Error()})
	}

	result, err := users.DeleteOne(c.Request.Context(), bson.M{"id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, nil)
	}
}
