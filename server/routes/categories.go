package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
)

func RegisterCategoryRoutes(categoryRoutes *gin.RouterGroup) {
	categoryRoutes.GET("/", handlers.GetCategories)

	protectedGroup := categoryRoutes.Group("")
	protectedGroup.Use(middleware.Authenticate())
	protectedGroup.Use(middleware.RoleAuth("admin", "worker", "owner"))
	protectedGroup.POST("/", handlers.AddCategory)
	protectedGroup.DELETE("/", handlers.DeleteCategory)
}
