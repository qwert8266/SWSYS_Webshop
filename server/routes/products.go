package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterProductRoutes(products *gin.RouterGroup) {

	// retrieving products:
	products.GET("/", handlers.GetProducts)
	products.GET("/:id", handlers.GetProductByID)
	products.GET("/category/:category", handlers.GetProductByCategory)

	// modifying products:
	products.POST("/", handlers.CreateProduct)
	products.PUT("/:id", handlers.UpdateProduct)
	products.DELETE("/:id", handlers.DeleteProduct)
}
