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

type LoginCredentials struct {
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
	UpdatedAt    time.Time `bson:"updated_at" json:"updatedAt"`
}

// PublicUser is the safe account representation returned to the frontend
type PublicUser struct {
	ID           uuid.UUID `json:"id"`
	CustomerType string    `json:"customerType"`
	Salutation   string    `json:"salutation"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastname"`
	BirthDate    string    `json:"birthDate,omitempty"`
	Phone        string    `json:"phone,omitempty"`
	CompanyName  string    `json:"companyName,omitempty"`
	Address      Address   `json:"address"`
	Email        string    `json:"email"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// AuthResponse is returned after registration and login
type AuthResponse struct {
	Message      string     `json:"message"`
	User         PublicUser `json:"user"`
	AccessToken  string     `json:"accessToken"`
	RefreshToken string     `json:"refreshToken"`
	TokenType    string     `json:"tokenType"`
	ExpiresIn    int64      `json:"expiresIn"`
}

// ToPublicUser convertes the persisted User into the safe API representation
func ToPublicUser(user User) PublicUser {
	return PublicUser{
		ID:           user.ID,
		CustomerType: user.CustomerType,
		Salutation:   user.Salutation,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		BirthDate:    user.BirthDate,
		Phone:        user.Phone,
		CompanyName:  user.CompanyName,
		Address:      user.Address,
		Email:        user.Email,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}
}
