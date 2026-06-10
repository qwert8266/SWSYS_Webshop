package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ProductID   uuid.UUID `json:"product_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       uint32    `json:"price"` //price is stored in Cents
	Stock       uint32    `json:"stock"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProductData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       uint32 `json:"price"` //price is stored in Cents
	Stock       uint32 `json:"stock"`
	Category    string `json:"category"`
}
