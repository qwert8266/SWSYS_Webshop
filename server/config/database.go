package config

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// LoadEnv loading enviroment variables from .env file.
func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Could not load .env file")
	}
}

// ConnectDB initializing the connection to the mongo database
func ConnectDB() *mongo.Client {
	uri := os.Getenv("MONGODB_URI")

	// Connects to MongoDB
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)

	client, err := mongo.Connect(opts)
	if err != nil {
		log.Fatal("Could not connect to MongoDB:", err)
	}

	// Pings the database to verify connection
	if err := client.Ping(context.TODO(), nil); err != nil {
		log.Fatal("Could not ping MongoDB:", err)
	}

	return client
}

// DisconnectDB disconnecting from the Database on shutdown
func DisconnectDB(client *mongo.Client) {
	if err := client.Disconnect(context.Background()); err != nil {
		log.Fatal("Could not disconnect MongoDB:", err)
	}
}

func NewProductCollection(client *mongo.Client) *mongo.Collection {
	return client.Database("products").Collection("products")
}

func NewUserCollection(client *mongo.Client) *mongo.Collection {
	return client.Database("users").Collection("users")
}
