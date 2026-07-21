export const CATEGORY_CONFIGS = [
  {
    name: "Angebote",
    slug: "angebote",
    dbCategory: "angebote",
    banner: { png: "angebote_top.png", sentence: "Schnell einkaufen!" },
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
    banner: { png: "wein_top2.png", sentence: "Wein in meinen Mund!" },
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
    banner: { png: "softdrinks_top.png", sentence: "Erfrischende Softgetränke" },
  },
  {
    name: "Wasser",
    slug: "wasser",
    dbCategory: "wasser",
    banner: { png: "water_top.png", sentence: "Wasser für jeden Tag" },
  },
  {
    name: "Kaffee & Tee",
    slug: "kaffee-tee",
    dbCategory: "kaffe-tee",
    banner: { png: "kaffee_banner.png", sentence: "Kaffee und Tee für deine Pause" },
  },
];


export const DEFAULT_CATEGORY_CONFIG_PRESENTATION = {
  banner: {
    png: "bier_top.png",
    sentence: "Unser Sortiment",
  },
};

export const CATEGORY_CONFIGS_PRESENTATION = {
  angebote: {
    banner: { png: "angebote_top.png", sentence: "Schnell einkaufen!" },
  },
  bier: {
    banner: { png: "bier_top2.png", sentence: "Bier geht doch immer!" },
  },
  "wein-sekt": {
    banner: { png: "wein_top2.png", sentence: "Wein in meinen Mund!" },
  },
  spirituosen: {
    banner: { png: "schnaps_top.png", sentence: "Ich fühl mich Osborne!" },
  },
  softgetraenke: { 
    banner: { png: "softdrinks_top.png", sentence: "Erfrischende Softgetränke" },
  },
  wasser: {
    banner: { png: "water_top.png", sentence: "Wasser für jeden Tag" },
  },
  "kaffee-tee": {
    banner: { png: "kaffee_banner.png", sentence: "Kaffee und Tee für deine Pause" },
  },
};

export function getCategoryPresentation(slug) {
  return (
    CATEGORY_CONFIGS_PRESENTATION[slug] ||
    DEFAULT_CATEGORY_CONFIG_PRESENTATION
  );
}

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
  