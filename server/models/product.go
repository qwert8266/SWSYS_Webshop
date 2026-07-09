package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ProductID   uuid.UUID `json:"product_id" bson:"product_id"`
	Name        string    `json:"name" bson:"name"`
	Description string    `json:"description" bson:"description"`
	Images      []string  `json:"images" bson:"images"` // multiple paths to images can be stored in a string array
	Price       uint32    `json:"price" bson:"price"`   //price is stored in Cents
	Stock       uint32    `json:"stock" bson:"stock"`
	Category    string    `json:"category" bson:"category"`
	CreatedAt   time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
}

type ProductData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       uint32 `json:"price"` //price is stored in Cents
	Stock       uint32 `json:"stock"`
	Category    string `json:"category"`
}

type StockOperation struct {
	Value int32 `json:"value"`
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
	ProductID uuid.UUID `json:"product_id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Stock     uint32    `json:"stock"`
	Status    string    `json:"status"`
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
		ProductID: product.ProductID,
		Name:      product.Name,
		Category:  product.Category,
		Stock:     product.Stock,
		Status:    StockStatus(product.Stock),
	}
}
