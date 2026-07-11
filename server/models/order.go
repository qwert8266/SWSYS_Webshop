package models

import (
	"time"

	"github.com/google/uuid"
)

// Order is stored in the Database orders collection
type Order struct {
	OrderID         uuid.UUID       `bson:"order_id" json:"orderId"`
	UserID          uuid.UUID       `bson:"user_id" json:"userId"`
	Items           []OrderItem     `bson:"items" json:"items"`
	ShippingAddress Address         `bson:"shipping_address" json:"shippingAddress"`
	PaymentMethod   string          `bson:"payment_method" json:"paymentMethod"`
	Status          string          `bson:"status" json:"status"`
	TotalPrice      uint32          `bson:"total_price" json:"totalPrice"`
	ReturnRequests  []ReturnRequest `bson:"return_requests,omitempty" json:"returnRequests,omitempty"`
	CreatedAt       time.Time       `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time       `bson:"updated_at" json:"updatedAt"`
}

// OrderItem is Stored inside an order document
type OrderItem struct {
	ProductID      uuid.UUID `bson:"product_id" json:"product_id"`
	Name           string    `bson:"name" json:"name"`
	Quantity       uint32    `bson:"quantity" json:"quantity"`
	PackSize       uint16    `bson:"pack_size" json:"pack_size"`
	Volume         uint16    `bson:"volume" json:"volume"`
	UnitPrice      uint32    `bson:"unit_price" json:"unitPrice"`
	LineTotalPrice uint32    `bson:"line_total_price" json:"lineTotalPrice"`
}

// CreateOrderRequest is sent by the frontend when checkout is completed
type CreateOrderRequest struct {
	Items           []CreateOrderItemRequest `json:"items"`
	ShippingAddress Address                  `json:"address"`
	PaymentMethod   string                   `json:"paymentMethod"`
}

// CreateOrderItemRequest contains the ordered product and its quantity
type CreateOrderItemRequest struct {
	ProductID string `json:"product_id"`
	PackSize  uint16 `json:"pack_size"`
	Volume    uint16 `json:"volume"`
	Quantity  uint32 `json:"quantity"`
}

type ReturnOrderRequest struct {
	Reason  string              `json:"reason"`
	Message string              `json:"message"`
	Items   []ReturnRequestItem `json:"items"`
}

type ReturnRequest struct {
	ReturnID  uuid.UUID           `bson:"return_id" json:"returnId"`
	Items     []ReturnRequestItem `bson:"items" json:"items"`
	Reason    string              `bson:"reason" json:"reason"`
	Message   string              `bson:"message" json:"message"`
	Status    string              `bson:"status" json:"status"`
	CreatedAt time.Time           `bson:"created_at" json:"createdAt"`
}

type ReturnRequestItem struct {
	ProductID string `bson:"product_id" json:"productId"`
	Name      string `bson:"name" json:"name"`
	Quantity  uint32 `bson:"quantity" json:"quantity"`
	PackSize  uint16 `bson:"pack_size" json:"pack_size"`
	Volume    uint16 `bson:"volume" json:"volume"`
}

type Statistics struct {
	TotalOrders        int64  `bson:"total_orders" json:"totalOrders"`
	TotalRevenue       uint32 `bson:"total_revenue" json:"totalRevenue"`
	AverageOrderValue  uint32 `bson:"average_order_value" json:"averageOrderValue"`
	RegisteredUsers    int64  `bson:"registered_users" json:"registeredUsers"`
	ProductsSold       uint32 `bson:"products_sold" json:"productsSold"`
	ProductsInStock    uint32 `bson:"products_in_stock" json:"productsInStock"`
	LowStockProducts   uint32 `bson:"low_stock_products" json:"lowStockProducts"`
	CanceledOrders     uint32 `bson:"canceled_orders" json:"canceledOrders"`
	AverageUserRevenue uint32 `bson:"average_user_revenue" json:"averageUserRevenue"`
	//CategoryStatistics map[string]CategoryStatistics `json:"categoryStatistics"`
}

type CategoryStatistics struct {
	Revenue      float64 `json:"revenue"`
	Orders       uint32  `json:"orders"`
	ProductsSold uint32  `json:"productsSold"`
}

type ProductStatistics struct {
	Name         string  `json:"name"`
	Revenue      float64 `json:"revenue"`
	ProductsSold uint32  `json:"productsSold"`
}

type UserStatistics struct {
}
