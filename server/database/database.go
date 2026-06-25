package database

import (
	"context"
	"errors"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// DB contains the shared MongoDB client after main() has initialized it.
var DB *mongo.Client

// LoadEnv loading environment variables from .env file.
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

// Name DatabaseName returns the configured MongoDB database name
func Name() string {
	return strings.TrimSpace(os.Getenv("MONGODB_DATABASE"))
}

// returns a MongoDB collection
func collection(name string) *mongo.Collection {
	if DB == nil {
		log.Fatal("MongoDB client is not initialized.")
	}
	return DB.Database(Name()).Collection(name)
}

// ProductCollection returns the products collection of the webshop database
func ProductCollection() *mongo.Collection { return collection("products") }

// UserCollection returns the users collection of the webshop database
func UserCollection() *mongo.Collection {
	return collection("users")
}

// OrderCollection returns the orders collection of the webshop database
func OrderCollection() *mongo.Collection {
	return collection("orders")
}

func CartCollection() *mongo.Collection { return collection("carts") }

func AddOwnerIfNotExist() (string, error) {
	result := UserCollection().FindOne(context.TODO(), bson.M{"role": "owner"})
	if result.Err() != nil {
		if !errors.Is(result.Err(), mongo.ErrNoDocuments) {
			// return the error
			return "", result.Err()
		}
		// if no owner exists add one
		owner := models.CreateOwner(os.Getenv("OWNER_PASSWORD"))
		_, err := UserCollection().InsertOne(context.TODO(), owner)
		if err != nil {
			return "", err
		}

		return "owner created successfully", nil
	}

	// if the owner already exists return nothing
	return "", nil
}
