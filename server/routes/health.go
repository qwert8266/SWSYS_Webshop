package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHealthRoute(server *gin.Engine) {
	server.GET("/health",
		func(c *gin.Context) {
			c.IndentedJSON(http.StatusOK, gin.H{
				"status": "healthy"})
		})
}
