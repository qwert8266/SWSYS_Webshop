package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/config"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// creates a new order for the logged-in user and reduces product stock
func CreateOrder(c *gin.Context) {
	// checkes if the user is logged in
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	var request models.CreateOrderRequst
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bestelldaten konnten nicht gelesen werden."})
		return
	}

	if len(request.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Der Warenkorb ist leer."})
		return
	}

	now := time.Now().UTC()
	reservedItems := make([]reservedStock, 0, len(request.Items))
	orderItems := make([]models.OrderItem, 0, len(request.Items))
	var totalPrice uint32

	// Goes through all the items in the shopping cart
	for _, requestedItem := range request.Items {
		productID, err := uuid.Parse(strings.TrimSpace(requestedItem.ProductID))

		// checks if the productID is valid
		if err != nil {
			//rollbackReservedStock(c, reservedItems)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültige ProduktID im Warenkorb."})
			return
		}

		// checks if at least one product has been ordered
		if requestedItem.Quantity <= 0 {
			rollbackReservedStock(c, reservedItems)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Die Bestellmenge muss mindestens 1 sein."})
			return
		}

		var product models.Product
		// selects product where stock value is >= quantity of the requested item
		filter := bson.M{
			"product_id": productID,
			"stock": bson.M{
				"$gte": requestedItem.Quantity,
			},
		}
		update := bson.M{
			"$inc": bson.M{"stock": -int32(requestedItem.Quantity)},
			"$set": bson.M{"updated_at": now},
		}

		// only products with enough avaliable stock are updated
		err = config.ProductCollection().FindOneAndUpdate(
			c.Request.Context(),
			filter,
			update,
			options.FindOneAndUpdate().SetReturnDocument(options.Before),
		).Decode(&product)

		// checks if the stock reduction failed
		if err != nil {
			rollbackReservedStock(c, reservedItems)

			// checks if no suitable product with enough stock was found
			if errors.Is(err, mongo.ErrNoDocuments) {
				var existingProduct models.Product
				findErr := config.ProductCollection().FindOne(c.Request.Context(), bson.M{"product_id": productID}).Decode(&existingProduct)

				// checks if the product does not exist at all
				if errors.Is(findErr, mongo.ErrNoDocuments) {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Ein Product aus dem Warenkorb wurde nicht gefunden."})
					return
				}

				// checks if a a database error occured whire searching for the product
				if findErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": findErr.Error()})
					return
				}
				c.JSON(http.StatusBadRequest, gin.H{
					"error":     fmt.Sprint("Nicht genug Bestand für %s.", existingProduct.Name),
					"productId": productID,
					"available": existingProduct.Stock,
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		reservedItems = append(reservedItems, reservedStock{ProductID: productID, Quantity: requestedItem.Quantity})

		lineTotal := uint32(product.Price) * uint32(requestedItem.Quantity)
		totalPrice += lineTotal
		orderItems = append(orderItems, models.OrderItem{
			ProductID:      product.ProductID,
			Name:           product.Name,
			Quantity:       requestedItem.Quantity,
			UnitPrice:      product.Price,
			LineTotalPrice: lineTotal,
		})
	}

	order := models.Order{
		OrderID:         uuid.New(),
		UserID:          claims.UserID,
		Items:           orderItems,
		ShippingAddress: normalizeOrderAddress(request.ShippingAddress),
		PaymentMethod:   strings.TrimSpace(request.PaymentMethod),
		Status:          "In Bearbeitung",
		TotalPrice:      totalPrice,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	// checks if the order was successfully saved
	if _, err := config.OrderCollection().InsertOne(c.Request.Context(), order); err != nil {
		rollbackReservedStock(c, reservedItems)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bestellung konnte nicht gespeichert werden."})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func GetMyOrders(c *gin.Context) {
	// checks if the user is logged in
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	cursor, err := config.OrderCollection().Find(
		c.Request.Context(),
		bson.M{"user_id": claims.UserID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	// If the order fails to load
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// checks if the loaded orders could be read
	var orders []models.Order
	if err := cursor.All(c.Request.Context(), &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Make sure that no orders return an empty array
	if orders == nil {
		orders = []models.Order{}
	}

	c.JSON(http.StatusOK, orders)
}

type reservedStock struct {
	ProductID uuid.UUID
	Quantity  uint32
}

func rollbackReservedStock(c *gin.Context, reservedItems []reservedStock) {
	// restores all items that have already been reserved
	for _, item := range reservedItems {
		_, _ = config.ProductCollection().UpdateOne(
			c.Request.Context(),
			bson.M{"product_id": item.ProductID},
			bson.M{
				"$inc": bson.M{"stock": uint32(item.Quantity)},
				"$set": bson.M{"updated_at": time.Now().UTC()},
			},
		)
	}
}

func normalizeOrderAddress(address models.Address) models.Address {
	return models.Address{
		Street:      strings.TrimSpace(address.Street),
		HouseNumber: strings.TrimSpace(address.HouseNumber),
		ZipCode:     strings.TrimSpace(address.ZipCode),
		City:        strings.TrimSpace(address.City),
		Country:     strings.TrimSpace(address.Country),
	}
}
