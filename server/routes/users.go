package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterUserRoutes(rg *gin.RouterGroup) {

	// Authentication endpoints
	rg.POST("/register", handlers.AddNewUser)
	rg.POST("/login", handlers.LoginUser)

	// Protected endpoint to read the currently logged-in acount
	rg.GET("/me", middleware.Authenticate(), handlers.GetCurrentUser)

	users := rg.Group("/users")
	{
		users.GET("/", handlers.GetUsers)
		users.GET("/:id", handlers.GetUserByID)

		users.DELETE("/:id", handlers.DeleteUser)
	}

}
