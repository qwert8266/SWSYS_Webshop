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
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Images      []string `json:"images"`
	Price       uint32   `json:"price"` //price is stored in Cents
	Stock       uint32   `json:"stock"`
	Category    string   `json:"category"`
}

type StockOperation struct {
	Value int32 `json:"value"`
}
