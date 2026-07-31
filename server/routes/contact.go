package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterContactRoutes(contactRequestRoutes *gin.RouterGroup) {

	contactRequestRoutes.Use(middleware.Authenticate())

	contactRequestRoutes.POST("", handlers.SubmitContactRequest)
	contactRequestRoutes.GET("", middleware.RoleAuth("worker", "admin", "owner"), handlers.GetContactRequests)
}
