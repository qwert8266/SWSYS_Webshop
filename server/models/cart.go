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
type CartItem struct {
	ProductID uuid.UUID `bson:"product_id" json:"product_id"`
	Quantity  uint32    `bson:"quantity" json:"quantity"`
}

type IncomingCartData struct {
	OwnerID uuid.UUID  `bson:"owner_id" json:"owner_id"`
	Items   []CartItem `bson:"items" json:"items"`
}

type CartItemError struct {
	ProductID uuid.UUID `json:"productID"`
	Reason    string    `json:"reason"`
	Available uint32    `json:"available,omitempty"` // only meaningful for stock issues
	Requested uint32    `json:"requested,omitempty"`
}
