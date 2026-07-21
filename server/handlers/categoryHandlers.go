package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const categoryImageRoot = "/images/categories"

var categoryImageExtensions = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".webp": true,
}

// GetCategories returns all categories currently registered in the DB
func GetCategories(c *gin.Context) {
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "name", Value: 1}})

	cursor, err := database.CategoryCollection().Find(c.Request.Context(), bson.M{}, findOptions)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var categories []models.Category
	if err = cursor.All(c.Request.Context(), &categories); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if categories == nil {
		categories = []models.Category{}
	}
	c.IndentedJSON(http.StatusOK, categories)
}

// AddCategory adds a new category to the DB if it does not exist yet
func AddCategory(c *gin.Context) {
	input, banner, err := readCategoryForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Sentence = strings.TrimSpace(input.Sentence)
	input.Slug = slugifyCategory(input.Slug, input.Name)

	if err := validateCategoryInput(input, banner != nil); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	count, err := database.CategoryCollection().CountDocuments(c.Request.Context(), bson.M{
		"$or": bson.A{bson.M{"slug": input.Slug}, bson.M{"name": input.Name}},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht geprüft werden"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Eine Kategorie mit diesem Namen oder Slug existiert bereits"})
		return
	}

	bannerPath, err := saveCategoryBanner(c, input.Slug, banner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name: input.Name, Slug: input.Slug, Sentence: input.Sentence, Banner: bannerPath,
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	if _, err := database.CategoryCollection().InsertOne(c.Request.Context(), category); err != nil {
		_ = os.RemoveAll(filepath.Join(categoryImageRoot, input.Slug))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht gespeichert werden"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory change a category, optionally replaces its banner
func UpdateCategory(c *gin.Context) {
	oldSlug := strings.TrimSpace(c.Param("slug"))
	if oldSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kategorie-Slug fehlt"})
		return
	}

	var existing models.Category
	err := database.CategoryCollection().FindOne(c.Request.Context(), bson.M{"slug": oldSlug}).Decode(&existing)
	if errors.Is(err, mongo.ErrNoDocuments) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategorie wurde nicht gefunden"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht geladen werden"})
		return
	}

	input, banner, err := readCategoryForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Sentence = strings.TrimSpace(input.Sentence)
	input.Slug = slugifyCategory(input.Slug, input.Name)

	if err := validateCategoryInput(input, true); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	duplicateCount, err := database.CategoryCollection().CountDocuments(c.Request.Context(), bson.M{
		"slug": bson.M{"$ne": oldSlug},
		"$or":  bson.A{bson.M{"slug": input.Slug}, bson.M{"name": input.Name}},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht geprüft werden"})
		return
	}
	if duplicateCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Eine andere Kategorie verwendet bereits diesen Namen oder Slug"})
		return
	}

	bannerPath := existing.Banner
	if banner != nil {
		bannerPath, err = saveCategoryBanner(c, input.Slug, banner)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// When only the slug changes, move the existing banner directory instead of uploading the file again
	} else if input.Slug != oldSlug && existing.Banner != "" {
		oldDirectory := filepath.Join(categoryImageRoot, oldSlug)
		newDirectory := filepath.Join(categoryImageRoot, input.Slug)
		if err := os.MkdirAll(filepath.Dir(newDirectory), os.ModePerm); err == nil {
			if renameErr := os.Rename(oldDirectory, newDirectory); renameErr == nil {
				bannerPath = strings.Replace(existing.Banner, "categories/"+oldSlug+"/", "categories/"+input.Slug+"/", 1)
			}
		}
	}

	updated := models.Category{
		Name:      input.Name,
		Slug:      input.Slug,
		Sentence:  input.Sentence,
		Banner:    bannerPath,
		CreatedAt: existing.CreatedAt,
		UpdatedAt: time.Now(),
	}

	if _, err := database.CategoryCollection().ReplaceOne(c.Request.Context(), bson.M{"slug": oldSlug}, updated); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht aktualisiert werden"})
		return
	}

	// Products contain complete category objects. Update these copies so links and labels stay consistent
	cursor, err := database.ProductCollection().Find(c.Request.Context(), bson.M{"categories.slug": oldSlug})
	if err == nil {
		var products []models.Product
		if cursor.All(c.Request.Context(), &products) == nil {
			for _, product := range products {
				changed := false
				for index := range product.Categories {
					if product.Categories[index].Slug == oldSlug {
						product.Categories[index] = updated
						changed = true
					}
				}
				if changed {
					_, _ = database.ProductCollection().UpdateOne(c.Request.Context(), bson.M{"product_id": product.ProductID}, bson.M{"$set": bson.M{"categories": product.Categories}})
				}
			}
		}
	}

	c.JSON(http.StatusOK, updated)
}

// DeleteCategory removes an unused category
func DeleteCategory(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Kategorie-Slug fehlt"})
		return
	}

	productCount, err := database.ProductCollection().CountDocuments(c.Request.Context(), bson.M{"categories.slug": slug})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "Kategorieverwendung konnte nicht geprüft werden"})
		return
	}
	if productCount > 0 {
		c.IndentedJSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Die Kategorie ist noch %d Produkt(en) zugeordnet", productCount)})
		return
	}

	result, err := database.CategoryCollection().DeleteOne(c.Request.Context(), bson.M{"slug": slug})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kategorie konnte nicht gelöscht werden"})
		return
	}
	if result.DeletedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Kategorie wurde nicht gefunden"})
		return
	}

	_ = os.RemoveAll(filepath.Join(categoryImageRoot, slug))
	c.Status(http.StatusNoContent)
}

type categoryInput struct {
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	Sentence string `json:"sentence"`
}
type multipartFileHeader struct{ File *multipart.FileHeader }

// readCategoryForm reads the JSON category data and the the optional banner from multipart request
func readCategoryForm(c *gin.Context) (categoryInput, *multipartFileHeader, error) {
	var input categoryInput
	if err := json.Unmarshal([]byte(c.PostForm("data")), &input); err != nil {
		return input, nil, errors.New("Kategoriedaten sind ungültig")
	}

	file, err := c.FormFile("banner")
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			return input, nil, nil
		}
		return input, nil, errors.New("Banner konnte nicht gelesen werden")
	}
	return input, &multipartFileHeader{file}, nil
}

// validateCategoryInput checks all required category fields and wether a banner is available
func validateCategoryInput(input categoryInput, bannerAvailable bool) error {
	if input.Name == "" {
		return errors.New("Bitte gib einen Kategorienamen an")
	}
	if input.Slug == "" {
		return errors.New("Aus dem Kategorienamen konnte kein gültiger Slug erstellt werden")
	}
	if input.Sentence == "" {
		return errors.New("Bitte gib einen Kategorie-Satz an")
	}
	if !bannerAvailable {
		return errors.New("Bitte wähle ein Bannerbild")
	}

	return nil
}

// saveCategoryBanner validate and stores a banner
func saveCategoryBanner(c *gin.Context, slug string, wrapper *multipartFileHeader) (string, error) {
	if wrapper == nil || wrapper.File == nil {
		return "", errors.New("Bannerbild fehlt")
	}

	extension := strings.ToLower(filepath.Ext(wrapper.File.Filename))
	if !categoryImageExtensions[extension] {
		return "", errors.New("Banner muss das Dateiformat .png, .jpg, .jpeg oder .webp besitzen")
	}

	directory := filepath.Join(categoryImageRoot, slug)
	if err := os.RemoveAll(directory); err != nil {
		return "", errors.New("Altes Banner konnte nicht entfernt werden")
	}

	if err := os.MkdirAll(directory, os.ModePerm); err != nil {
		return "", errors.New("Banner-Verzeichnis konnte nicht ertsellt werden")
	}

	filename := "banner" + extension
	if err := c.SaveUploadedFile(wrapper.File, filepath.Join(directory, filename)); err != nil {
		return "", errors.New("Banner konnte nicht gespeichert werden")
	}

	return filepath.ToSlash(filepath.Join("categories", slug, filename)), nil
}

// slugifCategory converts a custom slug or category name into a URL-save value
func slugifyCategory(slug, name string) string {
	value := strings.TrimSpace(slug)
	if value == "" {
		value = name
	}

	replacer := strings.NewReplacer("ä", "ae", "ö", "oe", "ü", "ue", "ß", "ss")
	value = strings.ToLower(replacer.Replace(value))
	value = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(value, "-")
	return strings.Trim(value, "-")

}
