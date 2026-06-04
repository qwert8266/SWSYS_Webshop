package models

import "github.com/google/uuid"

type User struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Address   string    `json:"address"`
}

type LoginCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
