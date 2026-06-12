package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
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
		return
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

	//updateOne() needs to be told how to modify the Document in the collection. (in this case using $set)
	updatedProduct := bson.D{
		{"$set", bson.D{{"name", name}}},
		{"$set", bson.D{{"description", description}}},
		{"$set", bson.D{{"price", updatedProductData.Price}}},
		{"$set", bson.D{{"stock", updatedProductData.Stock}}},
		{"$set", bson.D{{"category", normalizedCategory}}},
		{"$set", bson.D{{"updated_at", time.Now()}}},
	}

	productCollection := config.ProductCollection()

	//updating product in collection:
	if result, err := productCollection.UpdateOne(c.Request.Context(), bson.M{"product_id": productID}, updatedProduct); err != nil {
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
		return
	}

	productCollection := config.ProductCollection()

	result, err := productCollection.DeleteOne(c.Request.Context(), bson.M{"product_id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		c.IndentedJSON(http.StatusNoContent, gin.H{"message": "product deleted"})
	}
}

// ModifyStock is used to increase or decrease the stock of the specified product
func ModifyStock(c *gin.Context) {
	//retrieving the product ID
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
		return
	}

	// retrieving the amount to increase or decrease
	var operation models.StockOperation
	if err = c.BindJSON(&operation); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error parsing stock operation": err.Error()})
		return
	}

	// filtering for product specified
	filter := bson.M{
		"product_id": productID,
	}
	idFilter := filter

	var message strings.Builder

	//switching between increasing or decreasing stock
	if operation.Value > 0 {
		message.WriteString(fmt.Sprintf("stock amount increased by %d", operation.Value))
	} else if operation.Value < 0 {
		//adding a minimum stock to the filter to prevent modification if stock is insufficient
		filter = bson.M{
			"product_id": productID,
			"stock": bson.M{
				"$gte": -operation.Value,
			},
		}
		message.WriteString(fmt.Sprintf("stock amount decreased by %d", -operation.Value))
	} else {
		c.IndentedJSON(http.StatusOK, gin.H{"message": "congratulations, increasing by zero did absolutely nothing!"})
		return
	}

	//found product to retrieve stock from
	var product models.Product

	// creating update to stock
	updateToStock := bson.D{{"$inc", bson.D{{"stock", operation.Value}}}}
	err = config.ProductCollection().FindOneAndUpdate(
		c.Request.Context(),
		filter,
		updateToStock,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&product)

	if errors.Is(err, mongo.ErrNoDocuments) {
		// checking if the product exists
		var foundProduct models.Product
		if err = config.ProductCollection().FindOne(c.Request.Context(), idFilter).Decode(&foundProduct); err != nil {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
			return
		}
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "insufficient stock", "available": foundProduct.Stock})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": message.String(), "new_stock": product.Stock})
}
