package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetSales(c *gin.Context) {
	salesCollection := database.SalesCollection()

	cursor, err := salesCollection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var sales []models.Sale

	if err = cursor.All(c.Request.Context(), &sales); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if sales == nil {
		sales = []models.Sale{}
	}
	c.IndentedJSON(http.StatusOK, sales)
}

func AddSale(c *gin.Context) {

	//parsing incoming data
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error retrieving form": err.Error()})
		return
	}
	var newSale models.Sale
	if err := json.Unmarshal([]byte(c.PostForm("data")), &newSale); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing sale data": err.Error()})
		return
	}

	if newSale.Discount <= 0 || newSale.Discount > 100 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Der Rabatt muss zwischen 1 und 100 Prozent liegen"})
		return
	}

	// generating UUID
	newSale.SaleId = uuid.New()

	if images := form.File["image"]; len(images) > 0 && images[0] != nil {
		image := images[0]
		// if an image is provided, a new directory is created and the image is saved
		directory := filepath.Join("/images/sale", newSale.SaleId.String())
		newSale.Banner = filepath.Join(newSale.SaleId.String(), image.Filename)

		if err = os.MkdirAll(directory, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error creating directory": err.Error()})
			return
		}
		if err = c.SaveUploadedFile(image, filepath.Join(directory, image.Filename)); err != nil {
			_ = os.RemoveAll(directory)
			c.JSON(http.StatusInternalServerError, gin.H{"error creating file": err.Error()})
			return
		}
	}

	err = registerProductsOnSale(newSale.SaleId, newSale.Discount, newSale.ProductIds)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error registering products": err.Error()})
		return
	}

	// adding the new sale to the collection
	if _, err := database.SalesCollection().InsertOne(c.Request.Context(), newSale); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error adding new sale": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusCreated, newSale)
}

func registerProductsOnSale(saleId uuid.UUID, discount int8, productIds []uuid.UUID) error {
	for _, productId := range productIds {
		filter := bson.M{"product_id": productId}
		update := bson.M{"$set": bson.M{"discount": discount, "sale_id": saleId}}
		result, err := database.ProductCollection().UpdateOne(context.Background(), filter, update)
		if err != nil {
			return err
		} else if result.MatchedCount == 0 {
			return errors.New("product not found")
		}
	}
	return nil
}

func unregisterProductsOnSale(productIds []uuid.UUID) error {
	for _, productId := range productIds {
		filter := bson.M{"product_id": productId}
		update := bson.M{"$unset": bson.M{"discount": ""}}
		result, err := database.ProductCollection().UpdateOne(context.Background(), filter, update)
		if err != nil {
			return err
		} else if result.MatchedCount == 0 {
			return errors.New("product not found")
		}
	}
	return nil
}

func DeleteSale(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing sale id": err.Error()})
		return
	}

	sale := models.Sale{}
	err = database.SalesCollection().FindOne(c.Request.Context(), bson.M{"sale_id": id}).Decode(&sale)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error deleting sale": err.Error()})
		return
	}

	err = unregisterProductsOnSale(sale.ProductIds)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error unregistering products": err.Error()})
		return
	}

	result, err := database.SalesCollection().DeleteOne(c.Request.Context(), bson.M{"sale_id": id})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "sale not found"})
	} else {
		directory := filepath.Join("/images/sale", id.String())
		if err = os.RemoveAll(directory); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Bild konnte nicht gelöscht werden",
			})
		}
		c.IndentedJSON(http.StatusNoContent, gin.H{"message": "sale deleted"})
	}
}
