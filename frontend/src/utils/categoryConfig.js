export const CATEGORY_CONFIGS = [
  {
    name: "Angebote",
    slug: "angebote",
    dbCategory: "angebote",
    banner: { png: "", sentence: "" },
  },
  {
    name: "Bier",
    slug: "bier",
    dbCategory: "bier",
    banner: { png: "bier_top.png", sentence: "Bier geht doch immer!" },
  },
  {
    name: "Wein & Sekt",
    slug: "wein-sekt",
    dbCategory: "wein",
    banner: { png: "wein_top.png", sentence: "Wein in meinen Mund!" },
  },
  {
    name: "Spirituosen",
    slug: "spirituosen",
    dbCategory: "schnaps",
    banner: { png: "schnaps_top.png", sentence: "Ich fühl mich Osborne!" },
  },
  { name: "Softgetränke",
    slug: "softgetraenke",
    dbCategory: "softdrinks",
    banner: { png: "", sentence: "Erfrischende Softgetränke" },
  },
  {
    name: "Wasser",
    slug: "wasser",
    dbCategory: "wasser",
    banner: { png: "", sentence: "Wasser für jeden Tag" },
  },
  {
    name: "Kaffe & Tee",
    slug: "kaffe&tee",
    dbCategory: "kaffe-tee",
    banner: { png: "", sentence: "Kaffee und Tee für deine Pause" },
  },
];

export function findCategoryConfig(slugOrCategory) {
  const normalizedValue = String(slugOrCategory || "").trim().toLowerCase();

  return CATEGORY_CONFIGS.find(
    (category) => category.slug === normalizedValue || category.dbCategory === normalizedValue
  );
} 

export function getCategoryConfig(slugOrCategory) {
  return findCategoryConfig(slugOrCategory) || {
    name: slugOrCategory || "Kategorie",
    slug: slugOrCategory || "kategorie",
    dbCategory: slugOrCategory || "kategorie",
    banner: { png: "bier_top.png", sentence: "Unser Sortiment"},
  };
}