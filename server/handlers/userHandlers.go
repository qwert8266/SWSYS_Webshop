package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *gin.Context) {
	users := database.UserCollection()

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
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error parsing user data": err.Error()})
		return
	}

	validUserData, err := checkIncomingData(c, incomingUserData)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check if the email already exists in the DB
	if !checkForNoExistingEmail(c, validUserData.Email) {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "email already in use"})
		return
	}

	// hashing the password
	passwordHash, err := generateHash(c, validUserData.Password)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	now := time.Now().UTC()
	// a new UUID is created for the new user
	newUser := models.User{
		ID: uuid.New(),

		CustomerType: validUserData.CustomerType,
		Salutation:   strings.TrimSpace(validUserData.Salutation),
		FirstName:    strings.TrimSpace(validUserData.FirstName),
		LastName:     strings.TrimSpace(validUserData.LastName),
		BirthDate:    strings.TrimSpace(validUserData.BirthDate),
		Phone:        strings.TrimSpace(validUserData.Phone),

		CompanyName: strings.TrimSpace(validUserData.CompanyName),
		Address:     buildAddress(validUserData),

		Email:        validUserData.Email,
		PasswordHash: passwordHash,

		Role: "customer",

		CreatedAt: now,
		UpdatedAt: now,
	}

	// the new user is added to the list of users
	if _, err := database.UserCollection().InsertOne(c.Request.Context(), newUser); err != nil {
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
	validUserData, err := checkIncomingData(c, incomingUserData)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// get old user data for comparison
	currentUserData, err := findUserByID(c, id)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"message": "requested user not found"})
		} else {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// check if the email shall be changed
	if validUserData.Email != currentUserData.Email {
		if !checkForNoExistingEmail(c, validUserData.Email) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "email already in use"})
			return
		}
	}

	// build the new address
	newAddress := buildAddress(validUserData)

	// write the update
	updateToUser := bson.D{
		{"$set", bson.D{{"customer_type", validUserData.CustomerType}}},
		{"$set", bson.D{{"salutation", validUserData.Salutation}}},
		{"$set", bson.D{{"first_name", validUserData.FirstName}}},
		{"$set", bson.D{{"last_name", validUserData.LastName}}},
		{"$set", bson.D{{"birth_date", validUserData.BirthDate}}},
		{"$set", bson.D{{"phone", validUserData.Phone}}},
		{"$set", bson.D{{"company_name", validUserData.CompanyName}}},

		{"$set", bson.D{{"address", newAddress}}},

		{"$set", bson.D{{"email", validUserData.Email}}},

		{"$set", bson.D{{"updated_at", time.Now()}}},
	}

	var updatedUser models.User
	userCollection := database.UserCollection()

	//update the user
	err = userCollection.FindOneAndUpdate(
		c.Request.Context(),
		bson.M{"id": id},
		updateToUser,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedUser)

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

	result, err := database.UserCollection().DeleteOne(c.Request.Context(), bson.M{"id": id})
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
	if _, err := database.UserCollection().UpdateOne(
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
	accessToken, err := helpers.GenerateToken(user.ID, user.Email, helpers.AccessTokenType, helpers.JWTSecret(), helpers.AccessTokenTTL)
	if err != nil {
		return models.AuthResponse{}, err
	}

	refreshToken, err := helpers.GenerateToken(user.ID, user.Email, helpers.RefreshTokenType, helpers.JWTSecret(), helpers.RefreshTokenTTL)
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

func buildAddress(rr models.RegisterRequest) models.Address {

	//TODO: verify address data
	return models.Address{
		Street:      strings.TrimSpace(rr.Street),
		HouseNumber: strings.TrimSpace(rr.HouseNumber),
		ZipCode:     strings.TrimSpace(rr.ZipCode),
		City:        strings.TrimSpace(rr.City),
		Country:     strings.TrimSpace(rr.Country),
	}
}

func generateHash(c *gin.Context, password string) (string, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Password konnte nicht verarbeitet werden."})
		return "", err
	}
	return string(passwordHash), nil
}

func findUserByID(c *gin.Context, id uuid.UUID) (models.User, error) {
	var user models.User
	err := database.UserCollection().FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&user)
	return user, err
}

func findUserByEmail(c *gin.Context, email string) (models.User, error) {
	var user models.User
	err := database.UserCollection().FindOne(c.Request.Context(), bson.M{"email": email}).Decode(&user)
	return user, err
}

func checkForNoExistingEmail(c *gin.Context, email string) bool {
	existingUser, err := findUserByEmail(c, email)
	if err == nil && existingUser.ID != uuid.Nil {
		c.AbortWithStatusJSON(http.StatusConflict, gin.H{"error": "Diese E-Mail-Adresse ist bereits registriert."})
		return false
	}
	if !errors.Is(err, mongo.ErrNoDocuments) && err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return false
	}
	return true
}

func isEmailValid(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func checkIncomingData(c *gin.Context, rr models.RegisterRequest) (models.RegisterRequest, error) {

	// check email
	normalizedEmail := strings.ToLower(strings.TrimSpace(rr.Email))
	if !isEmailValid(normalizedEmail) {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Email ungültig"})
		return rr, errors.New("email invalid")
	}

	// check password length
	if len(rr.Password) < 8 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Passwort mit mindestens 8 Zeichen erforderlich."})
		return rr, errors.New("e-Mail und Passwort mit mindestens 8 Zeichen sind erforderlich")
	}

	// check customer type
	rr.CustomerType = strings.TrimSpace(rr.CustomerType)
	if rr.CustomerType != "private" && rr.CustomerType != "business" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Ungüliger Kundentyp."})
		return rr, errors.New("invalid customer type")
	}

	// check names
	rr.FirstName = strings.TrimSpace(rr.FirstName)
	rr.LastName = strings.TrimSpace(rr.LastName)
	if rr.FirstName == "" || rr.LastName == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Vorname und Nachname sind erforderlich."})
		return rr, errors.New("no name given")
	}

	// check company name
	rr.CompanyName = strings.TrimSpace(rr.CompanyName)
	if rr.CustomerType == "business" && rr.CompanyName == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Für ein Geschäftskonto ist der Unternehmensname erforderlich."})
		return rr, errors.New("no company name given")
	}
	return rr, nil
}

func UpdateUserRoleHandler(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var roleUpdate struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&roleUpdate); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// Validate the role
	validRole := false
	for _, role := range models.AllowedRoles {
		if roleUpdate.Role == role {
			validRole = true
			break
		}
	}

	if !validRole {
		c.JSON(400, gin.H{"error": "Invalid role"})
		return
	}

	userCollection := database.UserCollection()

	// Update the user's role
	update := bson.M{"$set": bson.M{"role": roleUpdate.Role}}

	if result, err := userCollection.UpdateOne(c.Request.Context(), bson.M{"id": userID}, update); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error updating product": err.Error()})
	} else if result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user not found"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Role updated successfully"})
	}
}

func ChangeOwnPassword(c *gin.Context) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	var request models.ChangePasswordRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültige Eingabe"})
		return
	}

	if request.CurrentPassword == "" || request.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Aktuelles Passwort und neues Passwort sind erforderlich."})
		return
	}

	if len(request.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Das neue Passwort muss mindestens 8 Zeichen lang sein."})
		return
	}

	if request.CurrentPassword == request.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden."})
		return
	}

	user, err := findUserByID(c, claims.UserID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Benutzer konnte nicht gefunden werden."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Benutzer konnte nicht geladen werden."})
		}
		return
	}

	if !helpers.VerifyPassword(user.PasswordHash, request.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Das aktuelle Password ist falsch."})
		return
	}
	newPasswordHash, err := generateHash(c, request.NewPassword)
	if err != nil {
		return
	}

	result, err := config.UserCollection().UpdateOne(
		c.Request.Context(),
		bson.M{"id": claims.UserID},
		bson.M{
			"$set": bson.M{
				"password_hash": newPasswordHash,
				"updated_at":    time.Now().UTC(),
			}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Passwort konnte nicht geändert werden."})
		return
	}
	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Benutzer wurde nicht gefunden"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Passwort wurde erfolgreich geändert."})
}

func RequestPasswordReset(c *gin.Context) {
	var request models.PasswordResetRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "E-Mail-Adresse ist erforderlich"}) //err.Error()
		return
	}

	email := strings.TrimSpace(strings.ToLower(request.Email))
	if email == "" || !isEmailValid(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gültige E-Mail-Adresse ist erforderlich."})
		return
	}

	genericResponse := gin.H{"message": fmt.Sprintf("Wir haben Ihnen eine E-Mail an %s mit weiteren Anweisungen gesendet. Die Zustellung kann bis zu 3 Minuten dauern. Bitte überprüfen Sie auch ihren Spam-Ordner.", request.Email)}

	user, err := findUserByEmail(c, email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusOK, genericResponse)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Passwort zurücksetzen ist zurzeit nicht verfügbar."}) //err.Error()
		return
	}

	resetToken, resetTokenHash, err := generatePasswordResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Reset-Token konnte nicht erzeugt werden."})
		return
	}

	now := time.Now().UTC()
	passwordResetTokenTTL := 30 * time.Minute
	resetTokenExpiresAt := now.Add(passwordResetTokenTTL)

	_, err = config.UserCollection().UpdateOne(
		c.Request.Context(),
		bson.M{"id": user.ID},
		bson.M{"$set": bson.M{
			"password_reset_token_hash":       resetTokenHash,
			"password_reset_token_expires_at": resetTokenExpiresAt,
			"updated_at":                      now,
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Reset-Token konnte nicht gespeichert werden."})
		return
	}
	passwordResetBaseURL := os.Getenv("PASSWORD_RESET_BASE_URL")
	resetURL := buildPasswordResetURL(passwordResetBaseURL, resetToken)
	//resetURL := passwordResetBaseURL + "?token=" + resetToken
	fmt.Printf(
		"[Password Reset]\nUser: %s\nToken: %s\nURL: %s\nExpiresAt: %s\n",
		user.Email,
		resetToken,
		resetURL,
		resetTokenExpiresAt.Format(time.RFC3339),
	)

	c.JSON(http.StatusOK, genericResponse)
}

func ConfirmPasswordReset(c *gin.Context) {
	var request models.PasswordResetConfirmRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resetToken := strings.TrimSpace(request.Token)
	if resetToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset-Token erforderlich."})
		return
	}

	if len(request.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Passwort mit mindestens 8 Zeichen erforderlich."})
		return
	}

	var user models.User
	now := time.Now().UTC()
	resetTokenHash := hashPasswordResetToken(resetToken)

	err := config.UserCollection().FindOne(
		c.Request.Context(),
		bson.M{
			"password_reset_token_hash":       resetTokenHash,
			"password_reset_token_expires_at": bson.M{"$gt": now},
		},
	).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Reset-Token ist ungültig oder abgelaufen."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	passwordHash, err := generateHash(c, request.Password)
	if err != nil {
		return
	}

	result, err := config.UserCollection().UpdateOne(
		c.Request.Context(),
		bson.M{
			"id":                        user.ID,
			"password_reset_token_hash": resetTokenHash,
		},
		bson.M{
			"$set": bson.M{
				"password_hash": passwordHash,
				"updated_at":    now,
			},
			"$unset": bson.M{
				"password_reset_token_hash":       "",
				"password_reset_token_expires_at": "",
			},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Passwort konnte nicht aktualisiert werden."})
		return
	}
	if result.MatchedCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset-Token wurde bereits verwendet oder ist ungültig."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Passwort wurde erfolgreich zurückgesetzt."})
}

func generatePasswordResetToken() (string, string, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", err
	}

	resetToken := base64.RawURLEncoding.EncodeToString(randomBytes)
	return resetToken, hashPasswordResetToken(resetToken), nil
}

func hashPasswordResetToken(resetToken string) string {
	hash := sha256.Sum256([]byte(resetToken))
	return hex.EncodeToString(hash[:])
}

func buildPasswordResetURL(baseURL string, resetToken string) string {
	baseURL = strings.TrimSpace(baseURL)
	separator := "?"
	if strings.Contains(baseURL, "?") {
		separator = "&"
	}

	return strings.TrimRight(baseURL, "/") + separator + "token=" + url.QueryEscape(resetToken)
}
