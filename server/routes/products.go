package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterProductRoutes(products *gin.RouterGroup) {

	// retrieving products:
	products.GET("/", handlers.GetProducts)
	products.GET("/category/:category", handlers.GetProductByCategory)
	products.GET("/:id", handlers.GetProductByID)

	//endpoints for modifying products should only be accessible to logged in employees and be protected though middleware:
	products.POST("/product_management", handlers.CreateProduct)
	products.PUT("/:id", handlers.UpdateProduct)
	products.PATCH("/:id", handlers.ModifyStock)
	products.DELETE("/:id", handlers.DeleteProduct)
}
