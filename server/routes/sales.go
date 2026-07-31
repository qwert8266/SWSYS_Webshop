package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterSaleRoutes(saleRoutes *gin.RouterGroup) {
	saleRoutes.GET("/", handlers.GetSales)

	protectedSaleRoutes := saleRoutes.Group("")
	protectedSaleRoutes.Use(middleware.Authenticate())
	protectedSaleRoutes.Use(middleware.RoleAuth("admin", "worker", "owner"))
	{
		protectedSaleRoutes.POST("/", handlers.AddSale)
		protectedSaleRoutes.DELETE("/:id", handlers.DeleteSale)
	}
}
