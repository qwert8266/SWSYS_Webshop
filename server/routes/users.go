package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterUserRoutes(rg *gin.RouterGroup) {

	// public routes which do not need authentication
	public := rg.Group("")
	{
		// Authentication endpoints
		public.POST("/register", handlers.AddNewUser)
		public.POST("/login", handlers.LoginUser)
	}

	// protected routes
	protected := rg.Group("")
	protected.Use(middleware.Authenticate())
	{
		// Protected so the backend can validate the submitted Bearer token before the frontend removes it from localStorage
		protected.POST("/logout", handlers.LogoutUser)

		// Protected endpoint to read the currently logged-in account
		protected.GET("/me", handlers.GetCurrentUser)

		// routes modifying users are only allowed for admins
		adminRoutes := protected.Group("")
		adminRoutes.Use(middleware.RoleAuth("admin"))
		{
			adminRoutes.GET("/", handlers.GetUsers)
			adminRoutes.GET("/:id", handlers.GetUserByID)
			adminRoutes.PATCH("/:id", handlers.ModifyUser)
			adminRoutes.DELETE("/:id", handlers.DeleteUser)

			adminRoutes.PUT("/users/:id/role", handlers.UpdateUserRoleHandler)
		}
	}
}
