package models

import (
	"time"

	"github.com/google/uuid"
)

type Cart struct {
	OwnerID   uuid.UUID  `bson:"owner_id" json:"ownerID"`
	Items     []CartItem `bson:"items" json:"items"`
	UpdatedAt time.Time  `bson:"updated_at" json:"updatedAt"`
}
type IncomingCartData struct {
	OwnerID uuid.UUID  `bson:"owner_id" json:"ownerID"`
	Items   []CartItem `bson:"items" json:"items"`
}

type CartItem struct {
	ProductID string `bson:"product_id" json:"productID"`
	Quantity  uint32 `bson:"quantity" json:"quantity"`
}
