package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterHealthRoute registers the single public health-endpoint
func RegisterHealthRoute(server *gin.Engine) {
	server.GET("/health",
		func(c *gin.Context) {
			c.IndentedJSON(http.StatusOK, gin.H{
				"status": "healthy"})
		})
}
