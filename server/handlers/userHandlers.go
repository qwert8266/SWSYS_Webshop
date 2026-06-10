package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

// var users = config.UserCollection()
//var emailRegex = regexp.MustCompile(os.Getenv("VALID_EMAIL_REGEX"))

func GetUsers(c *gin.Context) {
	users := config.UserCollection()

	cursor, err := users.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var user []models.User

	if err = cursor.All(c.Request.Context(), &user); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, user)
}

func GetUserByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	//var user models.User

	//err = users.FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&user)
	user, err := findUserByID(c, id)
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

func GetCurrentUser(c *gin.Context) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "nicht angemeldet."})
		return
	}

	user, err := findUserByID(c, claims.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User wurde nicht gefunden."})
		return
	}

	c.JSON(http.StatusOK, models.ToPublicUser(user))
}

func AddNewUser(c *gin.Context) {
	var incomingUserData models.RegisterRequest

	// the incoming JSON is parsed into newUser
	if err := c.BindJSON(&incomingUserData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user data": err.Error()})
		return
	}

	if !checkIncomingData(c, incomingUserData) {
		return
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(incomingUserData.Email))
	incomingUserData.CustomerType = strings.TrimSpace(incomingUserData.CustomerType)

	if normalizedEmail == "" || len(incomingUserData.Password) < 8 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "E-Mail und Passwort mit mindestens 8 Zeichen sind erforderlich."})
		return
	}

	existingUser, err := findUserByEmail(c, normalizedEmail)
	if err == nil && existingUser.ID != uuid.Nil {
		c.IndentedJSON(http.StatusConflict, gin.H{"error": "Diese E-Mail-Adresse ist bereits registriert."})
		return
	}
	if !errors.Is(err, mongo.ErrNoDocuments) && err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(incomingUserData.Password), bcrypt.DefaultCost)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Password konnte nicht verarbeitet werden."})
	}

	now := time.Now().UTC()
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
		CreatedAt: now,
		UpdatedAt: now,
	}

	// the new movie is added to the list of movies
	if _, err := config.UserCollection().InsertOne(c.Request.Context(), newUser); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response, err := buildAuthResponse("Registrierung erfolgreich", newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": "Token konnte nicht erzeugt werden."})
		return
	}

	c.JSON(http.StatusCreated, response)
}

func ModifyUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var incomingUserData models.RegisterRequest
	if err := c.BindJSON(&incomingUserData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user data": err.Error()})
		return
	}

	// checking the data for invalid syntax
	if !checkIncomingData(c, incomingUserData) {
		return
	}

	//updating the address
	newAddress := models.Address{
		Street:      strings.TrimSpace(incomingUserData.Street),
		HouseNumber: strings.TrimSpace(incomingUserData.HouseNumber),
		ZipCode:     strings.TrimSpace(incomingUserData.ZipCode),
		City:        strings.TrimSpace(incomingUserData.City),
		Country:     strings.TrimSpace(incomingUserData.Country),
	}

	updateToUser := bson.D{
		{"$set", bson.D{{"customer_type", incomingUserData.CustomerType}}},
		{"$set", bson.D{{"salutation", incomingUserData.Salutation}}},
		{"$set", bson.D{{"first_name", incomingUserData.FirstName}}},
		{"$set", bson.D{{"last_name", incomingUserData.LastName}}},
		{"$set", bson.D{{"birth_date", incomingUserData.BirthDate}}},
		{"$set", bson.D{{"phone", incomingUserData.Phone}}},
		{"$set", bson.D{{"company_name", incomingUserData.CompanyName}}},

		{"$set", bson.D{{"address", newAddress}}},

		{"$set", bson.D{{"updated_at", time.Now()}}},
	}

	var updatedUser models.User
	userCollection := config.UserCollection()

	//update the user
	err = userCollection.FindOneAndUpdate(c.Request.Context(), bson.M{"id": id}, updateToUser).Decode(&updatedUser)
	if errors.Is(err, mongo.ErrNoDocuments) {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
	c.IndentedJSON(http.StatusOK, models.ToPublicUser(updatedUser))
}

func DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user id": err.Error()})
	}

	result, err := config.UserCollection().DeleteOne(c.Request.Context(), bson.M{"id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, nil)
	}
}

func LoginUser(c *gin.Context) {
	// get Email and pas from req body
	var credentials models.LoginCredentials

	// validate user input
	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error()})
		return
	}

	// validate email and password
	email := strings.TrimSpace(strings.ToLower(credentials.Email))
	if email == "" || credentials.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"err": "E-Mail und Password sind erforderlich"})
		return
	}

	user, err := findUserByEmail(c, email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-Mail oder Passwort ist falsch"})
		return
	}

	// compare sent pass with saved user pass hash
	if !helpers.VerifyPassword(user.PasswordHash, credentials.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-Mail oder Passwort ist falsch"})
		return
	}

	// aktualisiert den Login-Zeitpunkt eines Users
	if _, err := config.UserCollection().UpdateOne(
		c.Request.Context(),
		bson.M{"id": user.ID},
		bson.M{"$set": bson.M{"updated_at": time.Now().UTC()}},
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login-Zeitpunkt konnte nicht aktualisiert werden."})
		return
	}

	// generiert einen Token
	response, err := buildAuthResponse("login erfolgreich", user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token konnte nicht erzeugt werden."})
		return
	}

	c.JSON(http.StatusOK, response)
}

func LogoutUser(c *gin.Context) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Abmeldung erfolgreich.",
		"userId":  claims.UserID,
	})
}

func buildAuthResponse(message string, user models.User) (models.AuthResponse, error) {
	accessToken, err := helpers.GenerateToken(user.ID, user.Email, helpers.AccessTokenType, config.JWTSecret(), helpers.AccessTokenTTL)
	if err != nil {
		return models.AuthResponse{}, err
	}

	refreshToken, err := helpers.GenerateToken(user.ID, user.Email, helpers.RefreshTokenType, config.JWTSecret(), helpers.RefreshTokenTTL)
	if err != nil {
		return models.AuthResponse{}, err
	}

	return models.AuthResponse{
		Message:      message,
		User:         models.ToPublicUser(user),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(helpers.AccessTokenTTL.Seconds()),
	}, nil
}

func findUserByID(c *gin.Context, id uuid.UUID) (models.User, error) {
	var user models.User
	err := config.UserCollection().FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&user)
	return user, err
}

func findUserByEmail(c *gin.Context, email string) (models.User, error) {
	var user models.User
	err := config.UserCollection().FindOne(c.Request.Context(), bson.M{"email": email}).Decode(&user)
	return user, err
}

func checkIncomingData(c *gin.Context, rr models.RegisterRequest) bool {
	if rr.CustomerType != "private" && rr.CustomerType != "business" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Ungüliger Kundentyp."})
		return false
	}

	if strings.TrimSpace(rr.FirstName) == "" || strings.TrimSpace(rr.LastName) == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Vorname und Nachname sind erforderlich."})
		return false
	}

	if rr.CustomerType == "business" && strings.TrimSpace(rr.CompanyName) == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Für ein Geschäftskonto ist der Unternehmensname erforderlich."})
		return false
	}
	return true
}
