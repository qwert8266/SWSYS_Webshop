package helpers

import "golang.org/x/crypto/bcrypt"

func VerifyPassword(passwordHash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) == nil
}
