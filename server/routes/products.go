package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterProductRoutes(products *gin.RouterGroup) {

	products.GET("/", handlers.GetProducts)
	products.GET("/:id", handlers.GetProductByID)
}
