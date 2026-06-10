package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// GetProducts returns all Products from MongoDB
func GetProducts(c *gin.Context) {
	productCollection := config.ProductCollection()

	cursor, err := productCollection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, products)
}

// GetProductByID returns a specific Product by its ID.
func GetProductByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var product models.Product
	productCollection := config.ProductCollection()

	err = productCollection.FindOne(c.Request.Context(), bson.M{"id": id}).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.IndentedJSON(http.StatusOK, product)

}

// GetProductByCategory returns all products of a specific category.
func GetProductByCategory(c *gin.Context) {
	category := c.Param("category")

	var products []models.Product
	productCollection := config.ProductCollection()

	cursor, err := productCollection.Find(c.Request.Context(), bson.M{"category": category})
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusOK, products)
}

// CreateProduct creates a new product and generates an uuid for it.
func CreateProduct(c *gin.Context) {
	var incomingProduct models.ProductData

	//parsing all incoming data
	if err := c.BindJSON(&incomingProduct); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product data": err.Error()})
		return
	}

	//trimming strings:
	name := strings.TrimSpace(incomingProduct.Name)
	description := strings.TrimSpace(incomingProduct.Description)
	normalizedCategory := strings.ToLower(strings.TrimSpace(incomingProduct.Category))

	// creating new user and generating a new user ID.
	newProduct := models.Product{
		ProductID:   uuid.New(),
		Name:        name,
		Description: description,
		Price:       incomingProduct.Price,
		Stock:       incomingProduct.Stock,
		Category:    normalizedCategory,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// adding the new user to the collection
	productCollection := config.ProductCollection()
	if _, err := productCollection.InsertOne(c.Request.Context(), newProduct); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error creating new product": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusCreated, newProduct)
}

// UpdateProduct allows modification of existing products values
func UpdateProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
	}
	var updatedProductData models.ProductData

	//parsing all incoming data
	if err := c.BindJSON(&updatedProductData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product data": err.Error()})
		return
	}

	//trimming strings:
	name := strings.TrimSpace(updatedProductData.Name)
	description := strings.TrimSpace(updatedProductData.Description)
	normalizedCategory := strings.ToLower(strings.TrimSpace(updatedProductData.Category))

	updatedProduct := models.Product{
		Name:        name,
		Description: description,
		Price:       updatedProductData.Price,
		Stock:       updatedProductData.Stock,
		Category:    normalizedCategory,
		UpdatedAt:   time.Now(),
	}

	productCollection := config.ProductCollection()

	//updating product in collection:
	if result, err := productCollection.UpdateOne(c.Request.Context(), bson.M{"id": productID}, updatedProduct); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error updating product": err.Error()})
	} else if result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		c.IndentedJSON(http.StatusOK, updatedProduct)
	}
}

// DeleteProduct deletes a product by its uuid.
func DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
	}

	productCollection := config.ProductCollection()

	result, err := productCollection.DeleteOne(c.Request.Context(), bson.M{"id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, nil)
	}
}
