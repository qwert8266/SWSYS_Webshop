package models

import "github.com/google/uuid"

type Sale struct {
	SaleId     uuid.UUID   `json:"sale_id" bson:"sale_id"`
	Banner     string      `json:"banner" bson:"banner"`
	Discount   int8        `json:"discount" bson:"discount"`       // price Reduction in % of total price
	ProductIds []uuid.UUID `json:"product_ids" bson:"product_ids"` // all product ids the sale applies to
}
