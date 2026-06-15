package main

import (
	"fmt"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/routes"
)

func main() {
	config.LoadEnv()

	config.DB = config.ConnectDB()
	defer config.DisconnectDB(config.DB)

	server := gin.Default()

	server.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}, //only used methods should be allowed
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.RegisterHealthRoute(server)

	routes.RegisterUserRoutes(server.Group("/user"))
	routes.RegisterProductRoutes(server.Group("/products"))
	routes.RegisterOrderRoutes(server.Group("/order"))

	// the addr is explicitly 0.0.0.0 because if the application is running inside a container,
	//it must handle requests from outside the container.
	err := server.Run("0.0.0.0:3001")
	if err != nil {
		fmt.Println(err)
	}

}
