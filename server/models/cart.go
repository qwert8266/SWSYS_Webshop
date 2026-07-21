package models

import (
	"time"

	"github.com/google/uuid"
)

type Cart struct {
	OwnerID   uuid.UUID  `bson:"owner_id" json:"owner_id"`
	Items     []CartItem `bson:"items" json:"items"`
	UpdatedAt time.Time  `bson:"updated_at" json:"updated_at"`
}
type IncomingCartData struct {
	OwnerID uuid.UUID  `bson:"owner_id" json:"owner_id"`
	Items   []CartItem `bson:"items" json:"items"`
}

type CartItem struct {
	ProductID string `bson:"product_id" json:"product_id"`
	Quantity  uint32 `bson:"quantity" json:"quantity"`
	Volume    uint32 `bson:"volume" json:"volume"`
	PackSize  uint32 `bson:"pack_size" json:"pack_size"`
}
