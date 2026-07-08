package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
)

func RegisterContactRoutes(rg *gin.RouterGroup) {
	rg.POST("", handlers.SubmitContactRequest)
	rg.GET("", handlers.GetContactRequests)
}
