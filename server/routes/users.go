package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterUserRoutes(users *gin.RouterGroup) {

	users.GET("/", handlers.GetUsers)
	users.GET("/:id", handlers.GetUserByID)
	users.POST("/", handlers.AddNewUser)
	users.DELETE("/:id", handlers.DeleteUser)
}
