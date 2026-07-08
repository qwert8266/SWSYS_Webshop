package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterUserRoutes(userRoutes *gin.RouterGroup) {

	// public routes which do not need authentication
	public := userRoutes.Group("")
	{
		// Authentication endpoints
		public.POST("/register", handlers.AddNewUser)
		public.POST("/login", handlers.LoginUser)
		public.POST("/password-reset/request", handlers.RequestPasswordReset)
		public.POST("/password-reset/confirm", handlers.ConfirmPasswordReset)
	}

	// protected user routes
	protected := userRoutes.Group("")
	protected.Use(middleware.Authenticate())
	{
		// Protected so the backend can validate the submitted Bearer token before the frontend removes it from localStorage
		protected.POST("/logout", handlers.LogoutUser)
		protected.GET("/me", handlers.GetCurrentUser)
		protected.GET("/me/lists", handlers.GetUserLists)
		protected.GET("/me/favorites", handlers.GetFavoriteProducts)
		protected.GET("/me/wishlist", handlers.GetWishlistProducts)
		protected.POST("/me/favorites/:productId", handlers.ToggleFavoriteProduct)
		protected.POST("/me/wishlist/:productId", handlers.ToggleWishlistProduct)
		protected.PATCH("/me/password", handlers.ChangeOwnPassword)

		// route was allowed for workers too, so that they can see the customer names when managing orders
		employeeRoutes := protected.Group("")
		employeeRoutes.Use(middleware.RoleAuth("worker", "admin"))
		{
			employeeRoutes.GET("/", handlers.GetUsers)
		}

		// routes modifying users are only allowed for admins
		adminRoutes := protected.Group("")
		adminRoutes.Use(middleware.RoleAuth("admin"))
		{
			adminRoutes.GET("/:id", handlers.GetUserByID)
			adminRoutes.PATCH("/:id", handlers.ModifyUser)
			adminRoutes.DELETE("/:id", handlers.DeleteUser)
			adminRoutes.PUT("/:id/role", handlers.UpdateUserRoleHandler)
		}
	}
}
