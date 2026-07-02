package models

import (
	"time"

	"github.com/google/uuid"
)

// ContactFormRequest contains the data sent by the contact form
type ContactFormRequest struct {
	Reason      string `json:"reason"`
	Description string `json:"description"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
}

// ContactRequest is stored in MongoDB
type ContactRequest struct {
	ID              uuid.UUID `bson:"id" json:"id"`
	ReferenceNumber string    `bson:"reference_number" json:"referenceNumber"`
	Reason          string    `bson:"reason" json:"reason"`
	Description     string    `bson:"description" json:"description"`
	Name            string    `bson:"name" json:"name"`
	Email           string    `bson:"email" json:"email"`
	Phone           string    `bson:"phone" json:"phone"`
	Status          string    `bson:"status" json:"status"`
	CreatedAt       time.Time `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time `bson:"updated_at" json:"updatedAt"`
}
