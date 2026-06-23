package handlers

import (
	"errors"
	"maps"
	"net/http"
	"slices"
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
			c.JSON(http.StatusOK, gin.H{"items": []models.CartItem{}})
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
	var cart models.IncomingCartData
	if err := c.BindJSON(&cart); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing cart data": err.Error()})
		return
	}

	// gathering ids for validation
	distinctIds := make(map[uuid.UUID]struct{}, len(cart.Items))
	for _, item := range cart.Items {
		distinctIds[item.ProductID] = struct{}{}
	}

	// checking db for valid ids and sufficient stock
	cursor, err := database.ProductCollection().
		Find(c.Request.Context(), bson.M{"product_id": bson.M{"$in": slices.Collect(maps.Keys(distinctIds))}},
			options.Find().SetProjection(bson.M{"product_id": 1, "stock": 1, "_id": 0}))
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// parsing product info from database
	var products []models.Product
	if err = cursor.All(c.Request.Context(), &[]models.Product{}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stockByID := make(map[uuid.UUID]uint32)
	for _, product := range products {
		stockByID[product.ProductID] = product.Stock
	}

	// validating the cart
	var problems []models.CartItemError
	for _, item := range cart.Items {
		stock, ok := stockByID[item.ProductID]
		switch {
		case !ok:
			problems = append(problems, models.CartItemError{
				ProductID: item.ProductID,
				Reason:    "not_found",
			})
		case item.Quantity <= 0:
			problems = append(problems, models.CartItemError{
				ProductID: item.ProductID,
				Reason:    "invalid_quantity",
			})
		case item.Quantity > stock:
			problems = append(problems, models.CartItemError{
				ProductID: item.ProductID,
				Reason:    "insufficient_stock",
				Available: stock,
				Requested: item.Quantity,
			})
		}
	}
	if len(problems) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"problems": problems})
		return
	}

	// writing update
	var updatedCart = models.Cart{
		OwnerID:   claims.UserID,
		Items:     cart.Items,
		UpdatedAt: time.Now(),
	}

	opts := options.Replace().SetUpsert(true)
	result, err := database.CartCollection().ReplaceOne(
		c.Request.Context(),
		bson.M{"owner_id": claims.UserID},
		&updatedCart,
		opts,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := http.StatusOK
	if result.UpsertedCount > 0 {
		status = http.StatusCreated
	}

	c.JSON(status, updatedCart)
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
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "cart not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, gin.H{"message": "cart deleted"})
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
