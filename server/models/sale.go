package models

import "github.com/google/uuid"

type Sale struct {
	SaleId   uuid.UUID  `json:"sale_id" bson:"sale_id"`
	Banner   string     `json:"banner" bson:"banner"`
	Discount int8       `json:"discount" bson:"discount"` // price Reduction in % of total price
	Items    []SaleItem `json:"items" bson:"items"`       // all product-variants the sale applies to
}

// SaleItem identfies exactly one product variant that belongs to a sale
type SaleItem struct {
	ProductID uuid.UUID `json:"product_id" bson:"product_id"`
	Volume    uint16    `json:"volume" bson:"volume"`
	PackSize  uint16    `json:"pack_size" bson:"pack_size"`
}
