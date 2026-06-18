package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterOrderRoutes(rg *gin.RouterGroup) {
	// protected routes/endpoints that only authorized users can access
	rg.Use(middleware.Authenticate())
	rg.POST("/", handlers.CreateOrder)
	rg.GET("/me", handlers.GetMyOrders)

	protectedOrders := rg.Group("")
	protectedOrders.Use(middleware.RoleAuth("admin", "worker"))
	{
		//TODO:
		//protectedOrders.GET("", handlers.GetAllOrders)
		//protectedOrders.GET("", handlers.GetActiveOrders)
	}
}
