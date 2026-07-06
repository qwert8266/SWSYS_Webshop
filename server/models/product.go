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
	Image       string     `json:"image" bson:"image"`
	Price       uint32     `json:"price" bson:"price"` //price is stored in Cents
	Stock       uint32     `json:"stock" bson:"stock"`
	Categories  []Category `json:"categories" bson:"categories"`
	CreatedAt   time.Time  `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" bson:"updated_at"`
}

type ProductData struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Image       string     `json:"image"`
	Price       uint32     `json:"price"` //price is stored in Cents
	Stock       uint32     `json:"stock"`
	Categories  []Category `json:"categories" bson:"categories"`
}

type StockOperation struct {
	Value int32 `json:"value"`
}

type Category struct {
	Name string `json:"name"`
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
