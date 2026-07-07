package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterProductRoutes(productRoutes *gin.RouterGroup) {

	// public productRoutes for retrieving products:
	productRoutes.GET("/", handlers.GetProducts)
	productRoutes.GET("/search", handlers.SearchProducts)
	productRoutes.GET("/category/:category", handlers.GetProductByCategory)
	productRoutes.GET("/:id", handlers.GetProductByID)
	productRoutes.POST("/", handlers.CreateProduct)
	productRoutes.PUT("/:id", handlers.UpdateProduct)
	productRoutes.PATCH("/:id", handlers.ModifyStock)
	productRoutes.DELETE("/:id", handlers.DeleteProduct)

	// public stock endpoints: customers only need the availability,
	// not the full product response
	productRoutes.GET("/stock", handlers.GetAllStock)
	productRoutes.GET("/:id/stock", handlers.GetProductStock)

	// protected routes
	protectedProductRoutes := productRoutes.Group("")
	protectedProductRoutes.Use(middleware.Authenticate())
	protectedProductRoutes.Use(middleware.RoleAuth("admin", "worker", "owner"))
	{
		//endpoints for modifying productRoutes should only be accessible to logged in employees and be protected though middleware:
		//protectedProductRoutes.POST("/", handlers.CreateProduct)
		//protectedProductRoutes.PUT("/:id", handlers.UpdateProduct)
		//protectedProductRoutes.PATCH("/:id", handlers.ModifyStock)
		//protectedProductRoutes.DELETE("/:id", handlers.DeleteProduct)

		// low-stock overview for the employee logistics panel
		protectedProductRoutes.GET("/stock/low", handlers.GetLowStock)
	}
}
