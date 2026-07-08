package handlers

import (
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/qwert8266/SWSYS_Webshop/server/database"
	"github.com/qwert8266/SWSYS_Webshop/server/models"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func SearchProducts(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))

	if len([]rune(query)) < 2 {
		c.IndentedJSON(
			http.StatusBadRequest,
			gin.H{"message": "search query must contain at least two characters"},
		)
		return
	}

	cursor, err := database.ProductCollection().Find(
		c.Request.Context(),
		bson.M{},
	)
	if err != nil {
		c.IndentedJSON(
			http.StatusInternalServerError,
			gin.H{"error": err.Error()},
		)
		return
	}

	var products []models.Product

	if err = cursor.All(c.Request.Context(), &products); err != nil {
		c.IndentedJSON(
			http.StatusInternalServerError,
			gin.H{"error": err.Error()},
		)
		return
	}

	type scoredProduct struct {
		Product models.Product
		Score   int
	}

	ranked := make([]scoredProduct, 0)

	for _, product := range products {
		score, matches := productSearchScore(product, query)

		if matches {
			ranked = append(ranked, scoredProduct{
				Product: product,
				Score:   score,
			})
		}
	}

	sort.SliceStable(ranked, func(i, j int) bool {
		return ranked[i].Score < ranked[j].Score
	})

	if len(ranked) > 30 {
		ranked = ranked[:30]
	}

	results := make([]models.Product, 0, len(ranked))

	for _, match := range ranked {
		results = append(results, match.Product)
	}

	c.IndentedJSON(http.StatusOK, results)
}

type searchableField struct {
	Value   string
	Penalty int
}

func productSearchScore(product models.Product, query string) (int, bool) {
	normalizedQuery := normalizeSearchText(query)

	if normalizedQuery == "" {
		return 0, false
	}

	fields := []searchableField{
		{Value: product.Name, Penalty: 0},
		{Value: product.Category, Penalty: 15},
		{Value: product.Description, Penalty: 30},
	}

	bestScore := 1_000_000
	matched := false

	for _, field := range fields {
		normalizedField := normalizeSearchText(field.Value)

		if normalizedField == "" {
			continue
		}

		if normalizedField == normalizedQuery {
			score := field.Penalty
			if score < bestScore {
				bestScore = score
			}
			matched = true
			continue
		}

		if strings.Contains(normalizedField, normalizedQuery) {
			score := field.Penalty + 5
			if score < bestScore {
				bestScore = score
			}
			matched = true
			continue
		}

		tokenScore, tokenMatches := fuzzyTokenScore(normalizedField, normalizedQuery)
		if tokenMatches {
			score := field.Penalty + tokenScore
			if score < bestScore {
				bestScore = score
			}
			matched = true
		}
	}

	return bestScore, matched
}

func normalizeSearchText(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))

	replacer := strings.NewReplacer(
		"ä", "ae",
		"ö", "oe",
		"ü", "ue",
		"ß", "ss",
		"'", "",
		"`", "",
		"´", "",
		"-", " ",
		"_", " ",
		".", " ",
		",", " ",
		":", " ",
		";", " ",
		"/", " ",
		"\\", " ",
		"&", " und ",
	)

	value = replacer.Replace(value)

	return strings.Join(strings.Fields(value), " ")
}

func fuzzyTokenScore(normalizedField string, normalizedQuery string) (int, bool) {
	queryTokens := strings.Fields(normalizedQuery)
	fieldTokens := strings.Fields(normalizedField)

	if len(queryTokens) == 0 || len(fieldTokens) == 0 {
		return 0, false
	}

	totalScore := 0

	for _, queryToken := range queryTokens {
		bestTokenScore := 1_000_000
		tokenMatched := false

		for _, fieldToken := range fieldTokens {
			if fieldToken == queryToken {
				bestTokenScore = 0
				tokenMatched = true
				break
			}

			if strings.Contains(fieldToken, queryToken) || strings.Contains(queryToken, fieldToken) {
				score := 5 + abs(len(fieldToken)-len(queryToken))
				if score < bestTokenScore {
					bestTokenScore = score
				}
				tokenMatched = true
				continue
			}

			distance := levenshteinDistance(queryToken, fieldToken)
			maxDistance := allowedDistance(queryToken)

			if distance <= maxDistance {
				score := 10 + distance*10
				if score < bestTokenScore {
					bestTokenScore = score
				}
				tokenMatched = true
			}
		}

		if !tokenMatched {
			return 0, false
		}

		totalScore += bestTokenScore
	}

	return totalScore, true
}

func allowedDistance(value string) int {
	length := len([]rune(value))

	if length <= 2 {
		return 0
	}

	if length <= 4 {
		return 1
	}

	if length <= 7 {
		return 2
	}

	return 3
}

func levenshteinDistance(a string, b string) int {
	aRunes := []rune(a)
	bRunes := []rune(b)

	if len(aRunes) == 0 {
		return len(bRunes)
	}

	if len(bRunes) == 0 {
		return len(aRunes)
	}

	previousRow := make([]int, len(bRunes)+1)
	currentRow := make([]int, len(bRunes)+1)

	for j := range previousRow {
		previousRow[j] = j
	}

	for i, aRune := range aRunes {
		currentRow[0] = i + 1

		for j, bRune := range bRunes {
			insertCost := currentRow[j] + 1
			deleteCost := previousRow[j+1] + 1
			replaceCost := previousRow[j]

			if aRune != bRune {
				replaceCost++
			}

			currentRow[j+1] = minimum(insertCost, deleteCost, replaceCost)
		}

		previousRow, currentRow = currentRow, previousRow
	}

	return previousRow[len(bRunes)]
}

func minimum(values ...int) int {
	smallest := values[0]

	for _, value := range values[1:] {
		if value < smallest {
			smallest = value
		}
	}

	return smallest
}

func abs(value int) int {
	if value < 0 {
		return -value
	}

	return value
}
