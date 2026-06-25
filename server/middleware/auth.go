package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/helpers"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
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
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization-Header muss das Format 'Bearer <token>' haben."})
			c.Abort()
			return
		}

		claims, err := helpers.ValidateToken(token, helpers.JWTSecret(), helpers.AccessTokenType)
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
		claims, ok := ClaimsFromContext(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
			return
		}

		var user models.User
		err := database.UserCollection().FindOne(c.Request.Context(), bson.M{"id": claims.UserID}).Decode(&user)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Nutzer wurde nicht gefunden."})
			return
		}

		// Check if the user's role is in the allowed roles
		roleAllowed := false
		for _, role := range roles {
			if user.Role == role {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
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
