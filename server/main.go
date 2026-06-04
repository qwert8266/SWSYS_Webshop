package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/handlers"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var DB *mongo.Client

func healthCheck(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, gin.H{"status": "healthy"})
}

func main() {
	config.LoadEnv()

	DB = config.ConnectDB()
	server := gin.Default()

	users := config.NewUserCollection(DB)
	products := config.NewProductCollection(DB)

	server.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}, //only used methods should be allowed
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	server.GET("/health", healthCheck)

	server.GET("/products", func(c *gin.Context) { handlers.GetProducts(c, products) })
	server.GET("/products/:id", func(c *gin.Context) { handlers.GetProductByID(c, products) })

	server.GET("/users", func(c *gin.Context) { handlers.GetUsers(c, users) })
	server.GET("/users/:id", func(c *gin.Context) { handlers.GetUserByID(c, users) })

	// the addr is explicitly 0.0.0.0 because if the application is running inside a container,
	//it must handle requests from outside the container.
	err := server.Run("0.0.0.0:3001")
	if err != nil {
		fmt.Println(err)
	}

	defer func() {
		config.DisconnectDB(DB)
	}()
}
