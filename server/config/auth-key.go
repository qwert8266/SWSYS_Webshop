package config

import (
	"log"
	"os"
	"strings"
)

// returns the secret used to sign and validate tokens.
func JWTSecret() string {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		log.Println("WARNING: JWT_SECRET is not set.")
	}

	return secret
}
