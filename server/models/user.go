package models

import (
	"time"

	"github.com/google/uuid"
)

// RegisterRequest matches the form fields sent by frontend/src/pages/register.jsx
type RegisterRequest struct {
	CustomerType string `json:"customerType"`
	Salutation   string `json:"salutation"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastname"`
	BirthDate    string `json:"birthDate"`
	Phone        string `json:"phone"`
	CompanyName  string `json:"companyName"`

	Street      string `json:"street"`
	HouseNumber string `json:"houseNumber"`
	ZipCode     string `json:"zipCode"`
	City        string `json:"city"`
	Country     string `json:"country"`

	Email    string `json:"email"`
	Password string `json:"password"`
}

type Address struct {
	Street      string `bson:"street" json:"street"`
	HouseNumber string `bson:"house_number" json:"houseNumber"`
	ZipCode     string `bson:"zip_code" json:"zipCode"`
	City        string `bson:"city" json:"city"`
	Country     string `bson:"country" json:"country"`
}

type User struct {
	ID           uuid.UUID `bson:"id" json:"id"`
	CustomerType string    `bson:"customer_type" json:"customerType"`
	Salutation   string    `bson:"salutation" json:"salutation"`
	FirstName    string    `bson:"first_name" json:"firstName"`
	LastName     string    `bson:"last__name" json:"lastname"`
	BirthDate    string    `bson:"birth_date,omitempty" json:"birthDate,omitempty"`
	Phone        string    `bson:"phone,omitempty" json:"phone,omitempty"`
	CompanyName  string    `bson:"company_name,omitempty" json:"companyName,omitempty"`
	Address      Address   `bson:"address" json:"address"`
	Email        string    `bson:"email" json:"email"`
	PasswordHash string    `bson:"password_hash" json:"-"`
	CreatedAt    time.Time `bson:"created_at" json:"createdAt"`
}

type LoginCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
