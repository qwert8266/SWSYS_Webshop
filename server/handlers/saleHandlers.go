package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
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
	imageDirectory := filepath.Join("/images/sale", newSale.SaleId.String())

	if images := form.File["image"]; len(images) > 0 && images[0] != nil {
		image := images[0]
		// if an image is provided, a new directory is created and the image is saved
		newSale.Banner = filepath.Join(newSale.SaleId.String(), image.Filename)

		if err = os.MkdirAll(imageDirectory, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error creating directory": err.Error()})
			return
		}
		if err = c.SaveUploadedFile(image, filepath.Join(imageDirectory, image.Filename)); err != nil {
			_ = os.RemoveAll(imageDirectory)
			c.JSON(http.StatusInternalServerError, gin.H{"error creating file": err.Error()})
			return
		}
	}

	registeredItems, err := registerVariantsOnSale(c, newSale.Discount, newSale.Items)
	if err != nil {
		_ = unregisterVariantsOnSale(c, registeredItems)
		_ = os.RemoveAll(imageDirectory)
		c.JSON(http.StatusConflict, gin.H{"error registering variants": err.Error()})
		return
	}

	// adding the new sale to the collection
	if _, err := database.SalesCollection().InsertOne(c.Request.Context(), newSale); err != nil {
		_ = unregisterVariantsOnSale(c, registeredItems)
		_ = os.RemoveAll(imageDirectory)
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error adding new sale": err.Error()})
		return
	}

	c.IndentedJSON(http.StatusCreated, newSale)
}

func registerVariantsOnSale(c *gin.Context, discount int8, items []models.SaleItem) ([]models.SaleItem, error) {
	registeredItems := make([]models.SaleItem, 0, len(items))
	for _, item := range items {
		filter := bson.M{
			"product_id": item.ProductID,
			"product_variants": bson.M{"$elemMatch": bson.M{
				"volume":    item.Volume,
				"pack_size": item.PackSize,
				"$or": bson.A{
					bson.M{"discount": bson.M{"$exists": false}},
					bson.M{"discount": nil},
					bson.M{"discount": 0},
				},
			}},
		}

		update := bson.M{"$set": bson.M{
			"product_variants.$.discount": discount,
		}}
		result, err := database.ProductCollection().UpdateOne(context.Background(), filter, update)
		if err != nil {
			return registeredItems, err
		}
		if result.MatchedCount == 0 {
			return registeredItems, fmt.Errorf("Productvariante %s (%d ml, Packungsgröße %d) wurde nicht gefunden", item.ProductID, item.Volume, item.PackSize)
		}
		registeredItems = append(registeredItems, item)
	}
	return registeredItems, nil
}

func unregisterVariantsOnSale(c *gin.Context, items []models.SaleItem) error {
	for _, item := range items {
		filter := bson.M{
			"product_id": item.ProductID,
			"product_variants": bson.M{"$elemMatch": bson.M{
				"volume":    item.Volume,
				"pack_size": item.PackSize,
			}},
		}

		update := bson.M{"$unset": bson.M{
			"product_variants.$.discount": "",
		}}
		result, err := database.ProductCollection().UpdateOne(context.Background(), filter, update)
		if err != nil {
			return err
		}
		if result.MatchedCount == 0 {
			return errors.New("zugeordnete Produktvariante wurde nicht gefunden")
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

	var sale models.Sale
	err = database.SalesCollection().FindOne(c.Request.Context(), bson.M{"sale_id": id}).Decode(&sale)
	if errors.Is(err, mongo.ErrNoDocuments) {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Sale not found"})
		return
	}
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error deleting sale": err.Error()})
		return
	}

	err = unregisterVariantsOnSale(c, sale.Items)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error unregistering products": err.Error()})
		return
	}

	result, err := database.SalesCollection().DeleteOne(c.Request.Context(), bson.M{"sale_id": id})
	if err != nil || result.DeletedCount == 0 {
		_, _ = registerVariantsOnSale(c, sale.Discount, sale.Items)
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}

	if err = os.RemoveAll(filepath.Join("/images/sale", id.String())); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bild konnte nicht gelöscht werden"})
		return
	}
	c.Status(http.StatusNoContent)
}
