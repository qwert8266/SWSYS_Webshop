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
	orderRoutes.GET("/me", handlers.GetMyOrders)

	protectedOrderRoutes := orderRoutes.Group("")
	protectedOrderRoutes.Use(middleware.RoleAuth("admin", "worker"))
	{
		//TODO:
		//protectedOrderRoutes.GET("", handlers.GetAllOrders)
		//protectedOrderRoutes.GET("", handlers.GetActiveOrders)
	}
}
