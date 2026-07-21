package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// GetProducts returns all Products from MongoDB
func GetProducts(c *gin.Context) {
	productCollection := database.ProductCollection()

	cursor, err := productCollection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	models.EnrichProductsVariantLabels(products)
	c.IndentedJSON(http.StatusOK, products)
}

// GetProductByID returns a specific Product by its ID.
func GetProductByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var product models.Product
	productCollection := database.ProductCollection()

	err = productCollection.FindOne(c.Request.Context(), bson.M{"product_id": id}).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	models.EnrichProductVariantLabels(&product)
	c.IndentedJSON(http.StatusOK, product)
}

// GetProductByCategory returns all products of a specific category.
func GetProductByCategory(c *gin.Context) {
	category := c.Param("category")

	var products []models.Product
	productCollection := database.ProductCollection()

	filter := bson.M{
		"$or": bson.A{
			bson.M{"categories.slug": category},
			bson.M{"categoeirs.name": category},
		},
	}

	cursor, err := productCollection.Find(c.Request.Context(), filter)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	models.EnrichProductsVariantLabels(products)
	c.IndentedJSON(http.StatusOK, products)
}

// CreateProduct creates a new product and generates an uuid for it.
func CreateProduct(c *gin.Context) {
	newProductID := uuid.New()

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error retrieving form": err.Error()})
		return
	}
	var incomingProduct models.ProductData
	if err := json.Unmarshal([]byte(c.PostForm("data")), &incomingProduct); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error parsing product data": err.Error()})
		return
	}

	images := form.File["image"]
	var imagePaths []string
	if images != nil {
		for _, image := range images {
			directory := filepath.Join("/images/", newProductID.String())
			imagePaths = append(imagePaths, filepath.Join(newProductID.String(), image.Filename))

			if err = os.MkdirAll(directory, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error creating directory" + err.Error()})
				return
			}
			if err = c.SaveUploadedFile(image, filepath.Join(directory, image.Filename)); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error creating file" + err.Error()})
				return
			}
		}
	}

	// validating incoming product data
	validProductData, err := checkIncomingProductData(c, incomingProduct)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "error checking incoming data: " + err.Error()})
		return
	}

	//normalizedCategory := strings.ToLower(strings.TrimSpace(validProductData.Category))

	name := strings.TrimSpace(validProductData.Name)
	description := strings.TrimSpace(validProductData.Description)

	for _, category := range validProductData.Categories {
		if !category.IsValid() {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid category"})
			return
		}
	}

	newProduct := models.Product{
		ProductID:       newProductID,
		Name:            name,
		Description:     description,
		Images:          imagePaths,
		ProductVariants: incomingProduct.ProductVariants,
		Categories:      incomingProduct.Categories,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	productCollection := database.ProductCollection()
	if _, err := productCollection.InsertOne(c.Request.Context(), newProduct); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error creating new product": err.Error()})
		return
	}

	models.EnrichProductVariantLabels(&newProduct)
	c.IndentedJSON(http.StatusCreated, newProduct)
}

// UpdateProduct allows modification of existing products values
func UpdateProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
		return
	}

	var incomingProduct models.ProductData
	if err := json.Unmarshal([]byte(c.PostForm("data")), &incomingProduct); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product data": err.Error()})
		return
	}

	updatedProductData, err := checkIncomingProductData(c, incomingProduct)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productCollection := database.ProductCollection()

	// Existing product is loaded so image change can be merged safely
	var existingProduct models.Product
	if err := productCollection.FindOne(c.Request.Context(), bson.M{"product_id": productID}).Decode(&existingProduct); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error retrieving product": err.Error()})
		}
		return
	}

	//parsing all incoming data
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error retrieving form": err.Error()})
		return
	}

	// Keeps the existing images
	// if none are sent the old image list stays untouched
	imagePaths := existingProduct.Images
	if incomingProduct.Images != nil {
		imagePaths = incomingProduct.Images
	}

	// Add newly uploaded image file to the product image list and save them in Docker Volume
	uploadedImages := form.File["image"]
	if len(uploadedImages) > 0 {
		directory := filepath.Join("/images/", productID.String())

		if err = os.MkdirAll(directory, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error creating directory": err.Error()})
			return
		}

		for _, image := range uploadedImages {
			if err = c.SaveUploadedFile(image, filepath.Join(directory, image.Filename)); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error creating file": err.Error()})
				return
			}

			imagePaths = append(imagePaths, filepath.Join(productID.String(), image.Filename))
		}
	}

	// Delete removed image from Docker volume
	for _, imageToDelete := range incomingProduct.RemovedImages {
		imageFilePath := filepath.Join("/images", imageToDelete)

		if err := os.Remove(imageFilePath); err != nil && !errors.Is(err, os.ErrNotExist) {
			c.JSON(http.StatusInternalServerError, gin.H{"error deleting image": err.Error()})
			return
		}
	}

	// Remove deleted images from imagePaths
	if len(incomingProduct.RemovedImages) > 0 {
		removedImageSet := make(map[string]bool)

		for _, removedImage := range incomingProduct.RemovedImages {
			removedImageSet[removedImage] = true
		}

		filteredImages := make([]string, 0, len(imagePaths))

		for _, image := range imagePaths {
			cleanImage := image

			if !removedImageSet[cleanImage] {
				filteredImages = append(filteredImages, cleanImage)
			}
		}

		imagePaths = filteredImages
	}

	existingDiscounts := make(map[string]*int8)
	for i := range existingProduct.ProductVariants {
		variant := existingProduct.ProductVariants[i]
		if variant.Discount != nil && *variant.Discount > 0 {
			key := fmt.Sprintf("%d-%d", variant.Volume, variant.PackSize)
			discount := *variant.Discount
			existingDiscounts[key] = &discount
		}
	}

	foundDiscountVariants := make(map[string]bool, len(existingDiscounts))
	for i := range updatedProductData.ProductVariants {
		variant := &updatedProductData.ProductVariants[i]
		key := fmt.Sprintf("%d-%d", variant.Volume, variant.PackSize)
		if discount, existing := existingDiscounts[key]; existing {
			variant.Discount = discount
			foundDiscountVariants[key] = true
		} else {
			variant.Discount = nil
		}
	}
	for key := range existingDiscounts {
		if !foundDiscountVariants[key] {
			c.JSON(http.StatusConflict, gin.H{"error": "A variant with an active sale cannot be removed or modified. Delete the sale first."})
			return
		}
	}

	//trimming strings:
	name := strings.TrimSpace(updatedProductData.Name)
	description := strings.TrimSpace(updatedProductData.Description)

	updatedProduct := bson.D{
		{"$set", bson.D{{"name", name}}},
		{"$set", bson.D{{"description", description}}},
		{"$set", bson.D{{"product_variants", updatedProductData.ProductVariants}}},
		{"$set", bson.D{{"images", imagePaths}}},
		{"$set", bson.D{{"categories", updatedProductData.Categories}}},
		{"$set", bson.D{{"updated_at", time.Now()}}},
	}

	//updating product in collection:
	if result, err := productCollection.UpdateOne(c.Request.Context(), bson.M{"product_id": productID}, updatedProduct); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error updating product": err.Error()})
	} else if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		// returnes the complete product object
		var savedProduct models.Product

		if err := productCollection.FindOne(c.Request.Context(), bson.M{"product_id": productID}).Decode(&savedProduct); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error retrieving product": err.Error()})
			return
		}
		c.JSON(http.StatusOK, savedProduct)
	}
}

// DeleteProduct deletes a product by its uuid.
func DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
		return
	}

	productCollection := database.ProductCollection()

	saleCount, countErr := database.SalesCollection().CountDocuments(
		c.Request.Context(),
		bson.M{"items.product_id": id},
	)
	if countErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": countErr.Error()})
		return
	}
	if saleCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "The product is part of an active sale. Delete the sale first"})
		return
	}

	result, err := productCollection.DeleteOne(c.Request.Context(), bson.M{"product_id": id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		directory := filepath.Join("/images", id.String())
		if err := os.RemoveAll(directory); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Bilder konnten nicht gelöscht werden",
			})
		}
		c.JSON(http.StatusNoContent, gin.H{"message": "product deleted"})
	}
}

func checkIncomingProductData(c *gin.Context, pd models.ProductData) (models.ProductData, error) {
	if pd.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name ungültig"})
		return pd, errors.New("name invalid")
	}

	if len(pd.ProductVariants) == 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Mindestens eine Produktvariante erforderlich"})
		return pd, errors.New("variants invalid")
	}

	for _, variant := range pd.ProductVariants {
		if variant.Price <= 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Preis ungültig"})
			return pd, errors.New("price invalid")
		}
		if variant.Volume <= 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Volumen ungültig"})
			return pd, errors.New("volume invalid")
		}
		if variant.PackSize <= 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Packungsgröße ungültig"})
			return pd, errors.New("pack size invalid")
		}
		if variant.Stock < 0 {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Bestand ungültig"})
			return pd, errors.New("stock invalid")
		}
	}

	if len(pd.Categories) == 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Mindestens eine Kategorie muss ausgewählt sein"})
		return pd, errors.New("no category")
	}

	for _, category := range pd.Categories {
		if !category.IsValid() {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Kategorie ungültig"})
			return pd, fmt.Errorf("category %s is invalid", category.Name)
		}
	}

	pd.Name = strings.TrimSpace(pd.Name)
	pd.Description = strings.TrimSpace(pd.Description)

	return pd, nil
}

// ModifyStock is used to increase or decrease the stock of the specified product
func ModifyStock(c *gin.Context) {
	//retrieving the product ID
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
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
		"product_variants": bson.M{
			"$elemMatch": bson.M{
				"volume":    operation.Volume,
				"pack_size": operation.PackSize,
			},
		},
	}

	/* setting the current filter as the filter for the specific product variant
	to determine in case of an error if the product variant exists or not. */
	productVariantFilter := filter

	var message strings.Builder

	//switching between increasing or decreasing stock
	if operation.Value > 0 {
		message.WriteString(fmt.Sprintf("stock amount increased by %d", operation.Value))
	} else if operation.Value < 0 {
		//adding a minimum stock to the filter to prevent modification if stock is not enough
		filter = bson.M{
			"product_id": productID,
			"product_variants": bson.M{
				"$elemMatch": bson.M{
					"volume":    operation.Volume,
					"pack_size": operation.PackSize,
					"stock": bson.M{
						"$gte": -operation.Value,
					},
				},
			},
		}
		message.WriteString(fmt.Sprintf("stock amount decreased by %d", -operation.Value))
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "congratulations, increasing by zero did absolutely nothing!"})
		return
	}

	//found product to retrieve stock from
	var product models.Product

	// creating update to stock
	update := bson.M{
		"$inc": bson.M{
			"product_variants.$.stock": operation.Value,
		},
		"$set": bson.M{"updated_at": time.Now().UTC()},
	}

	// performing the update to the stock as a single operation
	err = database.ProductCollection().FindOneAndUpdate(
		c.Request.Context(),
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&product)

	if errors.Is(err, mongo.ErrNoDocuments) {
		// checking if the product exists
		var foundProduct models.Product
		if err = database.ProductCollection().FindOne(c.Request.Context(), productVariantFilter).Decode(&foundProduct); err != nil {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product variant not found"})
			return
		}
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "insufficient stock", "available": foundProduct})
		return
	}
	models.EnrichProductVariantLabels(&product)
	c.IndentedJSON(http.StatusOK, gin.H{"message": message.String(), "new_product": product})
}

// GetProductStock returns only the stock information of a single product.
// Used by the frontend to display availability without loading the full product.
func GetProductStock(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var product models.Product

	err = database.ProductCollection().FindOne(c.Request.Context(), bson.M{"product_id": id}).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, models.NewStockInfo(product))
}

// GetAllStock returns the stock information of every product.
// The thresholds are included so clients never have to hardcode them.
func GetAllStock(c *gin.Context) {
	cursor, err := database.ProductCollection().Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stocks := make([]models.StockInfo, 0, len(products))
	for _, product := range products {
		stocks = append(stocks, models.NewStockInfo(product))
	}

	c.JSON(http.StatusOK, gin.H{
		"thresholds": gin.H{
			"low":      models.LowStockThreshold,
			"critical": models.CriticalStockThreshold,
		},
		"stocks": stocks,
	})
}

// GetLowStock returns all products at or below the low-stock threshold,
// sorted ascending by stock so the most urgent products come first.
// Intended for the employee logistics panel.
func GetLowStock(c *gin.Context) {
	cursor, err := database.ProductCollection().Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stocks := make([]models.StockInfo, 0)
	for _, product := range products {
		if len(product.ProductVariants) == 0 {
			info := models.NewStockInfo(product)
			if info.Stock <= models.LowStockThreshold {
				stocks = append(stocks, info)
			}
			continue
		}

		for _, variant := range product.ProductVariants {
			info := models.NewVariantStockInfo(product, variant)
			if info.Stock <= models.LowStockThreshold {
				stocks = append(stocks, info)
			}
		}
	}

	sort.Slice(stocks, func(i, j int) bool {
		return stocks[i].Stock < stocks[j].Stock
	})

	c.IndentedJSON(http.StatusOK, gin.H{
		"thresholds": gin.H{
			"low":      models.LowStockThreshold,
			"critical": models.CriticalStockThreshold,
		},
		"stocks": stocks,
	})
}
