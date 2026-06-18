package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterProductRoutes(products *gin.RouterGroup) {

	// retrieving products:
	products.GET("/", handlers.GetProducts)
	products.GET("/category/:category", handlers.GetProductByCategory)
	products.GET("/:id", handlers.GetProductByID)

	// protected routes
	protectedProducts := products.Group("")
	protectedProducts.Use(middleware.Authenticate())
	protectedProducts.Use(middleware.RoleAuth("admin", "worker"))
	{
		//endpoints for modifying products should only be accessible to logged in employees and be protected though middleware:
		protectedProducts.POST("/", handlers.CreateProduct)
		protectedProducts.PUT("/:id", handlers.UpdateProduct)
		protectedProducts.PATCH("/:id", handlers.ModifyStock)
		protectedProducts.DELETE("/:id", handlers.DeleteProduct)
	}
}
