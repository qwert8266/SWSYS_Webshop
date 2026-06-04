package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func GetUsers(c *gin.Context, collection *mongo.Collection) {
	cursor, err := collection.Find(c.Request.Context(), bson.M{})
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

func GetUserByID(c *gin.Context, collection *mongo.Collection) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var user models.User

	err = collection.FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&user)
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

func AddNewUser(c *gin.Context, collection *mongo.Collection) {
	var incomingUserData models.User

	// the incoming JSON is parsed into newUser
	if err := c.BindJSON(&incomingUserData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user data": err.Error()})
		return
	}

	// a new UUID is created for the new user
	newUser := models.User{
		ID:        uuid.New(),
		FirstName: incomingUserData.FirstName,
		LastName:  incomingUserData.LastName,
		Email:     incomingUserData.Email,
		Address:   incomingUserData.Address,
	}

	// the new movie is added to the list of movies
	if _, err := collection.InsertOne(c.Request.Context(), newUser); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusCreated, newUser.ID)
}

func DeleteUser(c *gin.Context, collection *mongo.Collection) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing user id": err.Error()})
	}

	result, err := collection.DeleteOne(c.Request.Context(), bson.M{"id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, nil)
	}
}
