package models

/*
import "testing"

func TestProductVariantDisplayLabel(t *testing.T) {
	tests := []struct {
		name    string
		variant ProductVariant
		want    string
	}{
		{
			name: "bekannter 6er Träger",
			variant: ProductVariant{
				PackSize:     PackSizeCarrier6,
				Volume:       500,
				CrateDeposit: 0,
			},
			want: "6er Träger (6 × 0,5 l)",
		},
		{
			name: "bekannter 20er Kasten mit Kistenpfand",
			variant: ProductVariant{
				PackSize:     PackSizeCase20,
				Volume:       500,
				CrateDeposit: 150,
			},
			want: "20er Kasten (20 × 0,5 l)",
		},
		{
			name: "unbekannte Größe mit Kistenpfand",
			variant: ProductVariant{
				PackSize:     18,
				Volume:       330,
				CrateDeposit: 150,
			},
			want: "18er Kasten (18 × 0,33 l)",
		},
		{
			name: "unbekannte kleine Größe ohne Kistenpfand",
			variant: ProductVariant{
				PackSize: 4,
				Volume:   330,
			},
			want: "4er Träger (4 × 0,33 l)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.variant.DisplayLabel(); got != tt.want {
				t.Fatalf("DisplayLabel() = %q, want %q", got, tt.want)
			}
		})
	}
}
*/
