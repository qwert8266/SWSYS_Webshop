package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func GetMyCart(c *gin.Context) {
	// checks if the user is logged in
	claims := getClaims(c)
	if claims == nil {
		return
	}

	// getting the cart
	var cart models.Cart
	err := database.CartCollection().FindOne(c.Request.Context(), bson.M{"owner_id": claims.UserID}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user has no cart yet"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
	} else {
		c.IndentedJSON(http.StatusOK, cart)
	}
}

func UpdateCart(c *gin.Context) {
	// checks if the user is logged in
	claims := getClaims(c)
	if claims == nil {
		return
	}

	//parsing all incoming data
	var incomingCart models.IncomingCartData
	if err := c.BindJSON(&incomingCart); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing cart data": err.Error()})
		return
	}

	// writing update
	var cart = models.Cart{
		OwnerID:   claims.UserID,
		Items:     incomingCart.Items,
		UpdatedAt: time.Now(),
	}

	err := database.CartCollection().FindOneAndReplace(c.Request.Context(), bson.M{"owner_id": claims.UserID}, &cart)
	if err != nil {
		if errors.Is(err.Err(), mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "user has no cart yet"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Err()})
		}
	} else {
		c.IndentedJSON(http.StatusOK, cart)
	}
}

func DeleteCart(c *gin.Context) {
	// checks if the user is logged in
	claims := getClaims(c)
	if claims == nil {
		return
	}

	result, err := database.CartCollection().DeleteOne(c.Request.Context(), bson.M{"owner_id": claims.UserID})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, gin.H{"message": "product deleted"})
	}
}

func getClaims(c *gin.Context) *helpers.Claims {
	// checks if the user is logged in
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
	}
	return claims
}
