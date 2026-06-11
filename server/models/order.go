package models

import (
	"time"

	"github.com/google/uuid"
)

// Order is stored in the Database orders collection
type Order struct {
	OrderID         uuid.UUID   `bson:"order_id" json:"orderId"`
	UserID          uuid.UUID   `bson:"user_id" json:"userId"`
	Items           []OrderItem `bson:"items" json:"items"`
	ShippingAddress Address     `bson:"shipping_address" json:"schippingAddress"`
	PaymentMethod   string      `bson:"payment_method" json:"paymentMethod"`
	Status          string      `bson:"status" json:"status"`
	TotalPrice      uint32      `bson:"total_price" json:"totalPrice"`
	CreatedAt       time.Time   `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time   `bson:"updated_at" json:"updatedAt"`
}

// Stored inside an order document
type OrderItem struct {
	ProductID      uuid.UUID `bson:"product_id" json:"productId"`
	Name           string    `bson:"name" json:"name"`
	Quantity       uint32    `bson:"quantity" json:"quantity"`
	UnitPrice      uint32    `bson:"unit_price" json:"unitPrice"`
	LineTotalPrice uint32    `bson:"line_total_price" json:"lineTotalPrice"`
}

// is sent by the frontend when checkout is completed
type CreateOrderRequst struct {
	Items           []CreateOrderItemRequst `json:"items"`
	ShippingAddress Address                 `json:"address"`
	PaymentMethod   string                  `json:"paymentMethod"`
}

// contains the ordered product and its quantity
type CreateOrderItemRequst struct {
	ProductID string `json:"productId"`
	Quantity  uint32 `json:"quantity"`
}
