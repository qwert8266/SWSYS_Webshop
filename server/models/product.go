package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ProductID   uuid.UUID `json:"product_id" bson:"product_id"`
	Name        string    `json:"name" bson:"name"`
	Description string    `json:"description" bson:"description"`
	Image       string    `json:"image" bson:"image"`

	ProductVariants []ProductVariant `json:"product_variants" bson:"product_variants"`

	Category  string    `json:"category" bson:"category"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type ProductData struct {
	Name        string `json:"name" bson:"name"`
	Description string `json:"description" bson:"description"`
	Image       string `json:"image" bson:"image"`

	ProductVariants []ProductVariant `json:"product_variants" bson:"product_variants"`

	Category string `json:"category" bson:"category"`
}

type ProductVariant struct {
	Price        uint32 `json:"price" bson:"price"` //price is stored in Cents
	Volume       uint16 `json:"volume" bson:"volume"`
	PackSize     uint16 `json:"pack_size" bson:"pack_size"`
	Deposit      uint16 `json:"deposit" bson:"deposit"`            //price is stored in Cents
	CrateDeposit uint16 `json:"crate_deposit" bson:"crateDeposit"` //price is stored in Cents
	Stock        uint32 `json:"stock" bson:"stock"`
}

type StockOperation struct {
	PackSize uint16 `json:"pack_size"`
	Volume   uint16 `json:"volume"`
	Value    int32  `json:"value"`
}
