package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterProductRoutes(r *gin.RouterGroup) {

	products := r.Group("/products")
	{
		products.GET("/", handlers.GetProducts)
		products.GET("/:id", handlers.GetProductByID)
	}
}
