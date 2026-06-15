package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func healthCheck(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, gin.H{"status": "healthy"})
}

func RegisterHealthRoute(server *gin.Engine) {
	server.GET("/health", healthCheck)
}
