package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterCartRoutes(cartRoutes *gin.RouterGroup) {

	cartRoutes.Use(middleware.Authenticate())
	cartRoutes.PUT("/", handlers.UpdateCart)
	cartRoutes.DELETE("/", handlers.DeleteCart)
	cartRoutes.GET("/me", handlers.GetMyCart)
}
