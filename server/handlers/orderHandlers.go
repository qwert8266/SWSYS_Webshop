package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/middleware"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// CreateOrder creates a new order for the logged-in user and reduces product stock
func CreateOrder(c *gin.Context) {
	// checks if the user is logged in
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	var request models.CreateOrderRequest
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

		// only products with enough available stock are updated
		err = database.ProductCollection().FindOneAndUpdate(
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
				findErr := database.ProductCollection().FindOne(c.Request.Context(), bson.M{"product_id": productID}).Decode(&existingProduct)

				// checks if the product does not exist at all
				if errors.Is(findErr, mongo.ErrNoDocuments) {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Ein Product aus dem Warenkorb wurde nicht gefunden."})
					return
				}

				// checks if a database error occurred while searching for the product
				if findErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": findErr.Error()})
					return
				}
				c.JSON(http.StatusBadRequest, gin.H{
					"error":     fmt.Sprintf("Nicht genug Bestand für %s.", existingProduct.Name),
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
	if _, err := database.OrderCollection().InsertOne(c.Request.Context(), order); err != nil {
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

	cursor, err := database.OrderCollection().Find(
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

func GetStatistics(c *gin.Context) {

	orderCollection := database.OrderCollection()
	orderCount, err := orderCollection.CountDocuments(c.Request.Context(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cursor, err := orderCollection.Find(c.Request.Context(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var totalRevenue uint32
	var productsSold uint32
	var canceledOrders uint32

	for cursor.Next(c.Request.Context()) {
		var order models.Order

		if err := cursor.Decode(&order); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		totalRevenue += order.TotalPrice

		if order.Status == "Storniert" {
			canceledOrders++
		}

		for _, item := range order.Items {
			productsSold += item.Quantity
		}
	}

	if err := cursor.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var averageOrderValue uint32

	if orderCount > 0 {
		averageOrderValue = totalRevenue / uint32(orderCount)
	}

	userCollection := database.UserCollection()
	userCount, err := userCollection.CountDocuments(c.Request.Context(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	productCollection := database.ProductCollection()
	cursor2, err2 := productCollection.Find(c.Request.Context(), bson.D{})
	if err2 != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err2.Error()})
		return
	}
	defer cursor2.Close(c.Request.Context())

	var totalStock uint32
	var lowStockCount uint32
	for cursor2.Next(c.Request.Context()) {
		var product models.Product

		if err := cursor2.Decode(&product); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		totalStock += product.Stock

		if product.Stock <= 10 {
			lowStockCount++
		}
	}

	if err := cursor2.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	averageUserRevenue := totalRevenue / uint32(userCount)

	statistics := models.Statistics{
		TotalOrders:        orderCount,
		TotalRevenue:       totalRevenue,
		AverageOrderValue:  averageOrderValue,
		RegisteredUsers:    userCount,
		ProductsSold:       productsSold,
		ProductsInStock:    totalStock,
		LowStockProducts:   lowStockCount,
		CanceledOrders:     canceledOrders,
		AverageUserRevenue: averageUserRevenue,
	}

	c.IndentedJSON(http.StatusOK, statistics)
}

// GetOrders returns all Orders from MongoDB
func GetOrders(c *gin.Context) {
	orderCollection := database.OrderCollection()

	cursor, err := orderCollection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var orders []models.Order

	if err = cursor.All(c.Request.Context(), &orders); err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Make sure that no orders return an empty array
	if orders == nil {
		orders = []models.Order{}
	}

	c.IndentedJSON(http.StatusOK, orders)

}

// UpdateProduct allows modification of existing products values
func UpdateOrder(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	fmt.Println("OrderID aus URL:", orderID)
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing order id": err.Error()})
		return
	}
	var updatedOrderData models.Order

	//parsing all incoming data
	if err := c.BindJSON(&updatedOrderData); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error parsing order data": err.Error()})
		return
	}

	//trimming strings:
	status := strings.TrimSpace(updatedOrderData.Status)

	orderCollection := database.OrderCollection()

	result, err := orderCollection.UpdateOne(
		c.Request.Context(),
		bson.M{"order_id": orderID},
		bson.M{
			"$set": bson.M{
				"status":     status,
				"updated_at": time.Now(),
			},
		},
	)

	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{
			"error updating order": err.Error(),
		})
		return
	}

	if result.MatchedCount == 0 {
		c.IndentedJSON(http.StatusNotFound, gin.H{
			"message": "order not found",
		})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"message": "order updated successfully",
	})

}

type reservedStock struct {
	ProductID uuid.UUID
	Quantity  uint32
}

func rollbackReservedStock(c *gin.Context, reservedItems []reservedStock) {
	// restores all items that have already been reserved
	for _, item := range reservedItems {
		_, _ = database.ProductCollection().UpdateOne(
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

func RequestOrderReturn(c *gin.Context) {
	claims, ok := middleware.ClaimsFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Nicht angemeldet."})
		return
	}

	orderID, err := uuid.Parse(strings.TrimSpace(c.Param("id")))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültige Bestellnummer."})
		return
	}

	var request models.ReturnOrderRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rücksendedaten konnten nicht gelesen werden."})
		return
	}

	reason := strings.TrimSpace(request.Reason)
	message := strings.TrimSpace(request.Message)

	if reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bitte gib einen Rücksendegrund an."})
		return
	}

	if len(request.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bitte wähle mindestens einen Artikel aus."})
		return
	}

	filter := bson.M{
		"order_id": orderID,
		"user_id":  claims.UserID,
	}

	var order models.Order
	if err := database.OrderCollection().FindOne(c.Request.Context(), filter).Decode(&order); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Bestellung wurde nicht gefunden."})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if order.Status == "Rücksendung beantragt" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Für diese Bestellung wurde bereits eine Rücksendung beantragt."})
		return
	}

	orderedQuantities := make(map[string]uint32)
	orderedNames := make(map[string]string)

	for _, item := range order.Items {
		productID := item.ProductID.String()
		orderedQuantities[productID] = item.Quantity
		orderedNames[productID] = item.Name
	}

	returnItems := make([]models.ReturnRequestItem, 0, len(request.Items))

	for _, item := range request.Items {
		productID := strings.TrimSpace(item.ProductID)

		if productID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ein Rücksendeartikel enthält keine Produkt-ID."})
			return
		}

		maxQuantity, exists := orderedQuantities[productID]
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ein Rücksendeartikel gehört nicht zu dieser Bestellung."})
			return
		}

		if item.Quantity == 0 || item.Quantity > maxQuantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültige Rücksendemenge."})
			return
		}

		name := strings.TrimSpace(item.Name)
		if name == "" {
			name = orderedNames[productID]
		}

		returnItems = append(returnItems, models.ReturnRequestItem{
			ProductID: productID,
			Name:      name,
			Quantity:  item.Quantity,
		})
	}

	now := time.Now().UTC()

	returnRequest := models.ReturnRequest{
		ReturnID:  uuid.New(),
		Items:     returnItems,
		Reason:    reason,
		Message:   message,
		Status:    "beantragt",
		CreatedAt: now,
	}

	update := bson.M{
		"$set": bson.M{
			"status":     "Rücksendung beantragt",
			"updated_at": now,
		},
		"$push": bson.M{
			"return_requests": returnRequest,
		},
	}

	var updatedOrder models.Order
	err = database.OrderCollection().FindOneAndUpdate(
		c.Request.Context(),
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedOrder)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Rücksendung konnte nicht gespeichert werden."})
		return
	}

	c.JSON(http.StatusOK, updatedOrder)
}
