package handlers

import (
	"errors"
	"net/http"
	"slices"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type userListResponse struct {
	FavoriteProductIDs []uuid.UUID `json:"favoriteProductIds"`
	WishlistProductIDs []uuid.UUID `json:"wishlistProductIds"`
}

type toggleListResponse struct {
	Active    bool      `json:"active"`
	ProductID uuid.UUID `json:"productId"`
}

func GetUserLists(c *gin.Context) {
	user, ok := currentUserFromContext(c)
	if !ok {
		return
	}

	c.JSON(http.StatusOK, userListResponse{
		FavoriteProductIDs: models.NormalizeProductIDs(user.FavoriteProductIDs),
		WishlistProductIDs: models.NormalizeProductIDs(user.WishlistProductIDs),
	})
}

func GetFavoriteProducts(c *gin.Context) {
	user, ok := currentUserFromContext(c)
	if !ok {
		return
	}

	products, err := findProductsByIDs(c, user.FavoriteProductIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetWishlistProducts(c *gin.Context) {
	user, ok := currentUserFromContext(c)
	if !ok {
		return
	}

	products, err := findProductsByIDs(c, user.WishlistProductIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

func ToggleFavoriteProduct(c *gin.Context) {
	toggleUserProductList(c, "favorite_product_ids")
}

func ToggleWishlistProduct(c *gin.Context) {
	toggleUserProductList(c, "wishlist_product_ids")
}

func currentUserFromContext(c *gin.Context) (models.User, bool) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return models.User{}, false
	}

	user, err := findUserByID(c, claims.UserID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Benutzer wurde nicht gefunden."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return models.User{}, false
	}

	return user, true
}

func toggleUserProductList(c *gin.Context, fieldName string) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültige Produkt-ID."})
		return
	}

	if err := ensureProductExists(c, productID); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Produkt wurde nicht gefunden."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	user, err := findUserByID(c, claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	currentIDs := user.FavoriteProductIDs
	if fieldName == "wishlist_product_ids" {
		currentIDs = user.WishlistProductIDs
	}

	active := !slices.Contains(currentIDs, productID)
	update := bson.M{
		"$set": bson.M{"updated_at": time.Now().UTC()},
	}

	if active {
		update["$addToSet"] = bson.M{fieldName: productID}
	} else {
		update["$pull"] = bson.M{fieldName: productID}
	}

	if _, err := database.UserCollection().UpdateOne(
		c.Request.Context(),
		bson.M{"id": claims.UserID},
		update,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toggleListResponse{
		Active:    active,
		ProductID: productID,
	})
}

func ensureProductExists(c *gin.Context, productID uuid.UUID) error {
	return database.ProductCollection().FindOne(
		c.Request.Context(),
		bson.M{"product_id": productID},
	).Err()
}

func findProductsByIDs(c *gin.Context, productIDs []uuid.UUID) ([]models.Product, error) {
	normalizedIDs := models.NormalizeProductIDs(productIDs)
	if len(normalizedIDs) == 0 {
		return []models.Product{}, nil
	}

	cursor, err := database.ProductCollection().Find(
		c.Request.Context(),
		bson.M{"product_id": bson.M{"$in": normalizedIDs}},
	)
	if err != nil {
		return nil, err
	}

	var products []models.Product
	if err := cursor.All(c.Request.Context(), &products); err != nil {
		return nil, err
	}

	if products == nil {
		return []models.Product{}, nil
	}

	productByID := make(map[uuid.UUID]models.Product, len(products))
	for _, product := range products {
		productByID[product.ProductID] = product
	}

	orderedProducts := make([]models.Product, 0, len(normalizedIDs))
	for _, productID := range normalizedIDs {
		if product, exists := productByID[productID]; exists {
			orderedProducts = append(orderedProducts, product)
		}
	}

	return orderedProducts, nil
}
