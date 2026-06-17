package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
)

// Authenticate validates a Bearer token and stores its claims in the Gin context.
func Authenticate() gin.HandlerFunc {

	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization-Header fehlt."})
			c.Abort()
			return
		}

		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if token == authHeader || token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Autorization-Header muss das Format 'Bearer <token>' haben."})
			c.Abort()
			return
		}

		claims, err := helpers.ValidateToken(token, config.JWTSecret(), helpers.AccessTokenType)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Ungültiger oder abgelaufener Token."})
			c.Abort()
			return
		}

		c.Set("claims", claims)
		c.Next()
	}
}

func RoleAuth(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {

		// retrieve the token from the context
		token := c.MustGet("claims").(helpers.Claims)

		// Check if the user's role is in the allowed roles
		roleAllowed := false
		for _, role := range roles {
			if token.Role == role {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ClaimsFromContext returns the authenticated token claims from the Gin context
func ClaimsFromContext(c *gin.Context) (*helpers.Claims, bool) {
	value, exists := c.Get("claims")
	if !exists {
		return nil, false
	}

	claims, ok := value.(*helpers.Claims)
	return claims, ok
}
