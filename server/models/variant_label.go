package models

import (
	"fmt"
	"strconv"
	"strings"
)

// Bekannte Packungsgrößen mit festen Anzeigenamen.
// Neue Standardgrößen können hier ergänzt werden.
const (
	PackSizeCarrier6 uint16 = 6
	PackSizeCase20   uint16 = 20
	PackSizeCase24   uint16 = 24
)

var namedPackSizes = map[uint16]string{
	PackSizeCarrier6: "6er Träger",
	PackSizeCase20:   "20er Kasten",
	PackSizeCase24:   "24er Kasten",
}

// DisplayLabel liefert eine lesbare Gebinden-Bezeichnung, z.B. "6er Träger (6 × 0,5 l)".
// Bekannte Packungsgrößen nutzen die Konstanten-Map, sonst gelten einfache Regeln
// anhand Kistenpfand und Packungsgröße.
func (v ProductVariant) DisplayLabel() string {
	name := v.packName()
	if v.Volume == 0 {
		return name
	}
	return fmt.Sprintf("%s (%d × %s)", name, v.PackSize, formatVolumeDE(v.Volume))
}

func (v ProductVariant) packName() string {
	if v.PackSize == 1 {
		if v.Volume == 0 {
			return "Einzelpackung"
		}
		return "Einzelgebinde"
	}

	if name, ok := namedPackSizes[v.PackSize]; ok {
		return name
	}

	if v.CrateDeposit > 0 {
		return fmt.Sprintf("%der Kasten", v.PackSize)
	}

	if v.PackSize <= 12 {
		return fmt.Sprintf("%der Träger", v.PackSize)
	}

	return fmt.Sprintf("%der Gebinde", v.PackSize)
}

func formatVolumeDE(volumeMl uint16) string {
	liters := float64(volumeMl) / 1000
	formatted := strconv.FormatFloat(liters, 'f', -1, 64)
	formatted = strings.Replace(formatted, ".", ",", 1)
	return formatted + " l"
}

// EnrichProductVariantLabels setzt variant_label für alle Varianten eines Produkts.
func EnrichProductVariantLabels(product *Product) {
	for i := range product.ProductVariants {
		product.ProductVariants[i].VariantLabel = product.ProductVariants[i].DisplayLabel()
	}
}

// EnrichProductsVariantLabels setzt variant_label für eine Produktliste.
func EnrichProductsVariantLabels(products []Product) {
	for i := range products {
		EnrichProductVariantLabels(&products[i])
	}
}
