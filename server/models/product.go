package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ProductID   uuid.UUID `json:"product_id" bson:"product_id"`
	Name        string    `json:"name" bson:"name"`
	Description string    `json:"description" bson:"description"`
	Images      []string  `json:"images" bson:"images"`

	ProductVariants []ProductVariant `json:"product_variants" bson:"product_variants"`

	Category  string    `json:"category" bson:"category"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type ProductData struct {
	Name        string `json:"name"`
	Description string `json:"description"`

	ProductVariants []ProductVariant `json:"product_variants"`

	Category string `json:"category"`
}

type ProductVariant struct {
	Price        uint32 `json:"price" bson:"price"` //price is stored in Cents
	Volume       uint16 `json:"volume" bson:"volume"`
	PackSize     uint16 `json:"pack_size" bson:"pack_size"`
	Deposit      uint16 `json:"deposit" bson:"deposit"`            //price is stored in Cents
	CrateDeposit uint16 `json:"crate_deposit" bson:"crateDeposit"` //price is stored in Cents
	Stock        uint32 `json:"stock" bson:"stock"`
	VariantLabel string `json:"variant_label,omitempty" bson:"-"`
}

type StockOperation struct {
	PackSize uint16 `json:"pack_size"`
	Volume   uint16 `json:"volume"`
	Value    int32  `json:"value"`
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
// It intentionally contains no price/description so stock checks stay cheap.
// Volume and PackSize are set when the entry refers to a specific variant.
type StockInfo struct {
	ProductID    uuid.UUID `json:"product_id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	Volume       uint16    `json:"volume"`
	PackSize     uint16    `json:"pack_size"`
	VariantLabel string    `json:"variant_label"`
	Stock        uint32    `json:"stock"`
	Status       string    `json:"status"`
}

// TotalStock sums the stock of all variants.
func (p Product) TotalStock() uint32 {
	var total uint32
	for _, variant := range p.ProductVariants {
		total += variant.Stock
	}
	return total
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

// NewStockInfo builds the stock response for a single product (total across variants).
func NewStockInfo(product Product) StockInfo {
	stock := product.TotalStock()
	return StockInfo{
		ProductID: product.ProductID,
		Name:      product.Name,
		Category:  product.Category,
		Stock:     stock,
		Status:    StockStatus(stock),
	}
}

// NewVariantStockInfo builds the stock response for one product variant.
func NewVariantStockInfo(product Product, variant ProductVariant) StockInfo {
	return StockInfo{
		ProductID:    product.ProductID,
		Name:         product.Name,
		Category:     product.Category,
		Volume:       variant.Volume,
		PackSize:     variant.PackSize,
		VariantLabel: variant.DisplayLabel(),
		Stock:        variant.Stock,
		Status:       StockStatus(variant.Stock),
	}
}
