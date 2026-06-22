package helpers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	// AccessTokenType marks a short-lived token for normal API request.
	AccessTokenType = "access"

	// RefreshTokenType marks a long-lived token that can be used to requerst a new access token later.
	RefreshTokenType = "refresh"

	// AcessTokenTTL is the validity period of an access token.
	AccessTokenTTL = 24 * time.Hour

	// RefreshTokenTTL is the validity period of an refresh token.
	RefreshTokenTTL = 7 * 24 * time.Hour
)

// Claims the signed payload stored inside a token
type Claims struct {
	UserID    uuid.UUID `json:"userId"`
	Email     string    `json:"email"`
	TokenType string    `json:"tokenType"`
	ExpiresAt int64     `json:"expiresAt"`
	IssuedAt  int64     `json:"issuedAt"`
}

type tokenHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"type"`
}

var base64URL = base64.RawURLEncoding

// GenerateToken creates a signed JWT-like HMAC token without an additional JWT dependency
func GenerateToken(userID uuid.UUID, email, tokenType, secret string, ttl time.Duration) (string, error) {
	now := time.Now().UTC()
	claims := Claims{
		UserID:    userID,
		Email:     email,
		TokenType: tokenType,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(ttl).Unix(),
	}

	headerPart, err := encodeJSON(tokenHeader{Algorithm: "HS256", Type: "JWT"})
	if err != nil {
		return "", err
	}

	payloadPart, err := encodeJSON(claims)
	if err != nil {
		return "", err
	}

	unsignedToken := headerPart + "." + payloadPart
	signature := sign(unsignedToken, secret)

	return unsignedToken + "." + signature, nil
}

// ValidateToken verifies the token signature and checks whether the token is expired
func ValidateToken(token, secret, expectedTokenType string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	unsignedToken := parts[0] + "." + parts[1]
	expectedSignature := sign(unsignedToken, secret)
	if !hmac.Equal([]byte(parts[2]), []byte(expectedSignature)) {
		return nil, errors.New("invalid token signature")
	}

	payload, err := base64URL.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token payload: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("invalid token claims: %w", err)
	}

	if claims.TokenType != expectedTokenType {
		return nil, errors.New("invalid token type")
	}

	if time.Now().UTC().Unix() > claims.ExpiresAt {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func encodeJSON(value any) (string, error) {
	bytes, err := json.Marshal(value)
	if err != nil {
		return "", err
	}

	return base64URL.EncodeToString(bytes), nil
}

func sign(unsignedToken, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsignedToken))
	return base64URL.EncodeToString(mac.Sum(nil))
}
