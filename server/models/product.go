package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"go.mongodb.org/mongo-driver/v2/bson"
)
type Product struct {
	ProductID   uuid.UUID  `json:"product_id" bson:"product_id"`
	Name        string     `json:"name" bson:"name"`
	Description string     `json:"description" bson:"description"`
	Images      []string   `json:"images" bson:"images"` // multiple paths to images can be stored in a string array
	Price       uint32     `json:"price" bson:"price"`   //price is stored in Cents
	Stock       uint32     `json:"stock" bson:"stock"`
	Discount    *int8      `json:"discount" bson:"discount,omitempty"`
	Categories  []Category `json:"categories" bson:"categories"`
	CreatedAt   time.Time  `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" bson:"updated_at"`
}


type ProductData struct {
	Name          string     `json:"name"`
	Description   string     `json:"description"`
	Images        []string   `json:"image"`
	RemovedImages []string   `json:"removed_images"`
	Price         uint32     `json:"price"` //price is stored in Cents
	Stock         uint32     `json:"stock"`
	Categories    []Category `json:"categories" bson:"categories"`
}

type StockOperation struct {
	Value int32 `json:"value"`
}

type Category struct {
	Name string `json:"name"`
	Slug string `json:"slug"` //Für URL's und co.
}

func (c Category) IsValid() bool {
	exists, err := database.CategoryCollection().CountDocuments(context.Background(), bson.M{"name": c.Name})
	if err != nil || 0 == exists {
		return false
	}

	return true
}

func (c Category) AddToDB() bool {
	if _, err := database.CategoryCollection().InsertOne(context.Background(), c); err != nil {
		return false
	}
	return true
}

func NormalizeProductIDs(ids []uuid.UUID) []uuid.UUID {
	if ids == nil {
		return []uuid.UUID{}
	}
	return ids
}

// Central stock thresholds. These are the single source of truth --
// the frontend receives the resulting status via the stock endpoints
// instead of hardcoding its own thresholds.
const (
	// LowStockThreshold marks products that should be reordered soon.
	LowStockThreshold uint32 = 15
	// CriticalStockThreshold marks products that are about to sell out.
	CriticalStockThreshold uint32 = 5
)

// Possible values of StockInfo.Status, ordered from best to worst.
const (
	StockStatusOK       = "ok"
	StockStatusLow      = "low"
	StockStatusCritical = "critical"
	StockStatusOut      = "out_of_stock"
)

// StockInfo is the response model of the dedicated stock endpoints.
// It intentionally contains no price/ description, so stock checks stay cheap.
type StockInfo struct {
	ProductID  uuid.UUID  `json:"product_id"`
	Name       string     `json:"name"`
	Categories []Category `json:"categories"`
	Stock      uint32     `json:"stock"`
	Status     string     `json:"status"`
}

// StockStatus maps a raw stock value onto one of the StockStatus* levels.
func StockStatus(stock uint32) string {
	switch {
	case stock == 0:
		return StockStatusOut
	case stock <= CriticalStockThreshold:
		return StockStatusCritical
	case stock <= LowStockThreshold:
		return StockStatusLow
	default:
		return StockStatusOK
	}
}

// NewStockInfo builds the stock response for a single product.
func NewStockInfo(product Product) StockInfo {
	return StockInfo{
		ProductID:  product.ProductID,
		Name:       product.Name,
		Categories: product.Categories,
		Stock:      product.Stock,
		Status:     StockStatus(product.Stock),
	}
}
