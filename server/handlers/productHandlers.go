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
	productCollection := database.ProductCollection()

	err = productCollection.FindOne(c.Request.Context(), bson.M{"product_id": id}).Decode(&product)
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
	productCollection := database.ProductCollection()

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
	newProductID := uuid.New()

	//parsing all incoming data
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error retrieving form": err.Error()})
		return
	}
	var incomingProduct models.ProductData
	if err := json.Unmarshal([]byte(c.PostForm("data")), &incomingProduct); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product data": err.Error()})
		return
	}

	// adding image if provided
	images := form.File["image"]
	var imagePaths []string
	if images != nil {
		for _, image := range images {
			// if an image is provided, a new directory is created and the image is saved
			directory := filepath.Join("/images/", newProductID.String())
			imagePaths = append(imagePaths, filepath.Join(newProductID.String(), image.Filename))

			if err = os.MkdirAll(directory, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error creating directory": err.Error()})
				return
			}
			if err = c.SaveUploadedFile(image, filepath.Join(directory, image.Filename)); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error creating file": err.Error()})
				return
			}
		}
	}

	validProductData, err := checkIncomingProductData(c, incomingProduct)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//trimming strings:
	name := strings.TrimSpace(validProductData.Name)
	description := strings.TrimSpace(validProductData.Description)

	for _, category := range validProductData.Categories {
		if !category.IsValid() {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "invalid category"})
			return
		}
	}

	// creating new user and generating a new user ID.
	newProduct := models.Product{
		ProductID:   newProductID,
		Name:        name,
		Description: description,
		Images:      imagePaths,
		Price:       incomingProduct.Price,
		Stock:       incomingProduct.Stock,
		Categories:  incomingProduct.Categories,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// adding the new user to the collection
	productCollection := database.ProductCollection()
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

	//trimming strings:
	name := strings.TrimSpace(updatedProductData.Name)
	description := strings.TrimSpace(updatedProductData.Description)

	//updateOne() needs to be told how to modify the Document in the collection. (in this case using $set)
	updatedProduct := bson.D{
		{"$set", bson.D{{"name", name}}},
		{"$set", bson.D{{"description", description}}},
		{"$set", bson.D{{"price", updatedProductData.Price}}},
		{"$set", bson.D{{"stock", updatedProductData.Stock}}},
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
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing product id": err.Error()})
		return
	}

	productCollection := database.ProductCollection()

	result, err := productCollection.DeleteOne(c.Request.Context(), bson.M{"product_id": id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	} else if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
	} else {
		directory := filepath.Join("/images", id.String())
		if err := os.RemoveAll(directory); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Bilder konnten nicht gelöscht werden",
			})
		}
		c.IndentedJSON(http.StatusNoContent, gin.H{"message": "product deleted"})
	}
}

func checkIncomingProductData(c *gin.Context, pd models.ProductData) (models.ProductData, error) {
	if pd.Name == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Name ungültig"})
		return pd, errors.New("name invalid")
	}

	if pd.Price <= 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Preis ungültig"})
		return pd, errors.New("price invalid")
	}

	if pd.Stock < 0 {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Stock ungültig"})
		return pd, errors.New("stock invalid")
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
	return pd, nil
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
		//adding a minimum stock to the filter to prevent modification if stock is not enough
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
	err = database.ProductCollection().FindOneAndUpdate(
		c.Request.Context(),
		filter,
		updateToStock,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&product)

	if errors.Is(err, mongo.ErrNoDocuments) {
		// checking if the product exists
		var foundProduct models.Product
		if err = database.ProductCollection().FindOne(c.Request.Context(), idFilter).Decode(&foundProduct); err != nil {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "product not found"})
			return
		}
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "insufficient stock", "available": foundProduct.Stock})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": message.String(), "new_stock": product.Stock})
}

// GetProductStock returns only the stock information of a single product.
// Used by the frontend to display availability without loading the full product.
func GetProductStock(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "the requested uuid is not a valid uuid"})
		return
	}

	var product models.Product

	err = database.ProductCollection().FindOne(c.Request.Context(), bson.M{"product_id": id}).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.IndentedJSON(http.StatusNotFound, gin.H{"message": "requested product not found"})
		} else {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.IndentedJSON(http.StatusOK, models.NewStockInfo(product))
}

// GetAllStock returns the stock information of every product.
// The thresholds are included so clients never have to hardcode them.
func GetAllStock(c *gin.Context) {
	cursor, err := database.ProductCollection().Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stocks := make([]models.StockInfo, 0, len(products))
	for _, product := range products {
		stocks = append(stocks, models.NewStockInfo(product))
	}

	c.IndentedJSON(http.StatusOK, gin.H{
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
	// filtering in the database instead of in Go keeps the response small
	filter := bson.M{"stock": bson.M{"$lte": models.LowStockThreshold}}

	cursor, err := database.ProductCollection().Find(
		c.Request.Context(),
		filter,
		options.Find().SetSort(bson.D{{"stock", 1}}),
	)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stocks := make([]models.StockInfo, 0, len(products))
	for _, product := range products {
		stocks = append(stocks, models.NewStockInfo(product))
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"thresholds": gin.H{
			"low":      models.LowStockThreshold,
			"critical": models.CriticalStockThreshold,
		},
		"stocks": stocks,
	})
}

func SearchProducts(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))

	if len([]rune(query)) < 2 {
		c.IndentedJSON(
			http.StatusBadRequest,
			gin.H{"message": "search query must contain at least two characters"},
		)
		return
	}

	cursor, err := database.ProductCollection().Find(
		c.Request.Context(),
		bson.M{},
	)
	if err != nil {
		c.IndentedJSON(
			http.StatusInternalServerError,
			gin.H{"error": err.Error()},
		)
		return
	}

	var products []models.Product

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(
			http.StatusInternalServerError,
			gin.H{"error": err.Error()},
		)
		return
	}

	type scoredProduct struct {
		Product models.Product
		Score   int
	}

	ranked := make([]scoredProduct, 0)

	for _, product := range products {
		score, matches := productSearchScore(product, query)

		if matches {
			ranked = append(ranked, scoredProduct{
				Product: product,
				Score:   score,
			})
		}
	}

	sort.SliceStable(ranked, func(i, j int) bool {
		return ranked[i].Score < ranked[j].Score
	})

	if len(ranked) > 30 {
		ranked = ranked[:30]
	}

	results := make([]models.Product, 0, len(ranked))

	for _, match := range ranked {
		results = append(results, match.Product)
	}

	c.IndentedJSON(http.StatusOK, results)
}

type searchableField struct {
	Value   string
	Penalty int
}

func productSearchScore(product models.Product, query string) (int, bool) {
	normalizedQuery := normalizeSearchText(query)

	if normalizedQuery == "" {
		return 0, false
	}

	categoryValue := getProductCategoryValue(product)

	fields := []searchableField{
		{Value: product.Name, Penalty: 0},
		{Value: categoryValue, Penalty: 15},
		{Value: product.Description, Penalty: 30},
	}

	bestScore := 1_000_000
	matched := false

	for _, field := range fields {
		normalizedField := normalizeSearchText(field.Value)

		if normalizedField == "" {
			continue
		}

		if normalizedField == normalizedQuery {
			score := field.Penalty
			if score < bestScore {
				bestScore = score
			}
			matched = true
			continue
		}

		if strings.Contains(normalizedField, normalizedQuery) {
			score := field.Penalty + 5
			if score < bestScore {
				bestScore = score
			}
			matched = true
			continue
		}

		tokenScore, tokenMatches := fuzzyTokenScore(normalizedField, normalizedQuery)
		if tokenMatches {
			score := field.Penalty + tokenScore
			if score < bestScore {
				bestScore = score
			}
			matched = true
		}
	}

	return bestScore, matched
}

func getProductCategoryValue(product models.Product) string {
	if len(product.Categories) > 0 {
		if product.Categories[0].Slug != "" {
			return product.Categories[0].Slug
		}

		if product.Categories[0].Name != "" {
			return product.Categories[0].Name
		}
	}
	return ""
}

func normalizeSearchText(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))

	replacer := strings.NewReplacer(
		"ä", "ae",
		"ö", "oe",
		"ü", "ue",
		"ß", "ss",
		"'", "",
		"`", "",
		"´", "",
		"-", " ",
		"_", " ",
		".", " ",
		",", " ",
		":", " ",
		";", " ",
		"/", " ",
		"\\", " ",
		"&", " und ",
	)

	value = replacer.Replace(value)

	return strings.Join(strings.Fields(value), " ")
}

func fuzzyTokenScore(normalizedField string, normalizedQuery string) (int, bool) {
	queryTokens := strings.Fields(normalizedQuery)
	fieldTokens := strings.Fields(normalizedField)

	if len(queryTokens) == 0 || len(fieldTokens) == 0 {
		return 0, false
	}

	totalScore := 0

	for _, queryToken := range queryTokens {
		bestTokenScore := 1_000_000
		tokenMatched := false

		for _, fieldToken := range fieldTokens {
			if fieldToken == queryToken {
				bestTokenScore = 0
				tokenMatched = true
				break
			}

			if strings.Contains(fieldToken, queryToken) || strings.Contains(queryToken, fieldToken) {
				score := 5 + abs(len(fieldToken)-len(queryToken))
				if score < bestTokenScore {
					bestTokenScore = score
				}
				tokenMatched = true
				continue
			}

			distance := levenshteinDistance(queryToken, fieldToken)
			maxDistance := allowedDistance(queryToken)

			if distance <= maxDistance {
				score := 10 + distance*10
				if score < bestTokenScore {
					bestTokenScore = score
				}
				tokenMatched = true
			}
		}

		if !tokenMatched {
			return 0, false
		}

		totalScore += bestTokenScore
	}

	return totalScore, true
}

func allowedDistance(value string) int {
	length := len([]rune(value))

	if length <= 2 {
		return 0
	}

	if length <= 4 {
		return 1
	}

	if length <= 7 {
		return 2
	}

	return 3
}

func levenshteinDistance(a string, b string) int {
	aRunes := []rune(a)
	bRunes := []rune(b)

	if len(aRunes) == 0 {
		return len(bRunes)
	}

	if len(bRunes) == 0 {
		return len(aRunes)
	}

	previousRow := make([]int, len(bRunes)+1)
	currentRow := make([]int, len(bRunes)+1)

	for j := range previousRow {
		previousRow[j] = j
	}

	for i, aRune := range aRunes {
		currentRow[0] = i + 1

		for j, bRune := range bRunes {
			insertCost := currentRow[j] + 1
			deleteCost := previousRow[j+1] + 1
			replaceCost := previousRow[j]

			if aRune != bRune {
				replaceCost++
			}

			currentRow[j+1] = minimum(insertCost, deleteCost, replaceCost)
		}

		previousRow, currentRow = currentRow, previousRow
	}

	return previousRow[len(bRunes)]
}

func minimum(values ...int) int {
	smallest := values[0]

	for _, value := range values[1:] {
		if value < smallest {
			smallest = value
		}
	}

	return smallest
}

func abs(value int) int {
	if value < 0 {
		return -value
	}

	return value
}
