package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterOrderRoutes(orderRoutes *gin.RouterGroup) {
	// protected routes/endpoints that only authorized users can access
	orderRoutes.Use(middleware.Authenticate())
	orderRoutes.POST("/", handlers.CreateOrder)
	orderRoutes.PUT("/:id", handlers.UpdateOrder)
	orderRoutes.GET("/me", handlers.GetMyOrders)
	orderRoutes.POST("/:id/return-request", handlers.RequestOrderReturn)
	orderRoutes.GET("/", handlers.GetOrders)

	protectedOrderRoutes := orderRoutes.Group("")
	protectedOrderRoutes.Use(middleware.RoleAuth("admin", "worker"))
	{
		//TODO:
		//protectedOrderRoutes.GET("", handlers.GetAllOrders)
		//protectedOrderRoutes.GET("", handlers.GetActiveOrders)
	}
}
