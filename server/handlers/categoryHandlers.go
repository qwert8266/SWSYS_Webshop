package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// GetCategories returns all categories currently registered in the DB
func GetCategories(c *gin.Context) {
	cursor, err := database.CategoryCollection().Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var categories []models.Category
	if err = cursor.All(c.Request.Context(), &categories); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, categories)
}

// AddCategory adds a new category to the DB if it does not exist yet
func AddCategory(c *gin.Context) {
	var category models.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if category.IsValid() {
		c.IndentedJSON(http.StatusConflict, gin.H{"error": "Category already exists"})
	} else {
		if !category.AddToDB() {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Category could not be added"})
		} else {
			c.JSON(http.StatusCreated, gin.H{"data": category})
		}
	}
}

func DeleteCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if category.IsValid() {
		result, err := database.CategoryCollection().DeleteOne(c.Request.Context(), bson.M{"name": category.Name})
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		} else if result.DeletedCount == 0 {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else {
			c.IndentedJSON(http.StatusNoContent, gin.H{"message": "category deleted"})
		}
	}
}
