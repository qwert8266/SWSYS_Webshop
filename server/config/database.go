package config

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// DB contains the shared MongoDB client after main() has initialized it.
var DB *mongo.Client

// LoadEnv loading enviroment variables from .env file.
func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Could not load .env file")
	}

}

// ConnectDB creates the MongoDB client and verifies the connection with ping
func ConnectDB() *mongo.Client {

	uri := os.Getenv("MONGODB_URI")
	if !strings.HasPrefix(uri, "mongodb://") {
		log.Fatalf("Invalid MongoDB Uri: %q.", uri)
	}

	// Connects to MongoDB
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)

	client, err := mongo.Connect(opts)
	if err != nil {
		log.Fatal("Could not connect to MongoDB:", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Pings the database to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Could not ping MongoDB:", err)
	}

	return client
}

// DisconnectDB disconnecting from the Database on shutdown
func DisconnectDB(client *mongo.Client) {
	if client == nil {
		return
	}

	if err := DB.Disconnect(context.Background()); err != nil {
		log.Fatal("Could not disconnect MongoDB:", err)
	}
}

// DatabaseName returns the configured MongoDB database name
func DatabaseName() string {
	return strings.TrimSpace(os.Getenv("MONGODB_DATABASE"))
}

// returns a MongoDB collection
func collection(name string) *mongo.Collection {
	if DB == nil {
		log.Fatal("MongoDB client is not initialized.")
	}
	return DB.Database(DatabaseName()).Collection(name)
}

// ProductCollection returns the products collection of the webshop database
func ProductCollection() *mongo.Collection {
	return collection("products")
}

// UserCollection returns the users collection of the webshop database
func UserCollection() *mongo.Collection {
	return collection("users")
}

// OrderCollection returns the orders collection of the webshop database
func OrderCollection() *mongo.Collection {
	return collection("orders")
}
