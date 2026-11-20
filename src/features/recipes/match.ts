import type { IngredientMatch, PantryEntry, Recipe, RecipeIngredient, RecipeMatch } from './types';

/**
 * Basics most kitchens always have. They are shown in a recipe but never
 * counted as missing. (A future settings screen could let people edit this.)
 */
export const DEFAULT_STAPLES = [
  'salt',
  'black pepper',
  'pepper',
  'water',
  'oil',
  'olive oil',
  'vegetable oil',
  'sugar',
];

const IRREGULAR: Record<string, string> = {
  tomatoes: 'tomato',
  potatoes: 'potato',
  leaves: 'leaf',
  loaves: 'loaf',
  berries: 'berry',
  cherries: 'cherry',
  chillies: 'chili',
  chilies: 'chili',
  chiles: 'chili',
};

function singular(word: string): string {
  if (IRREGULAR[word]) return IRREGULAR[word];
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 3 && word.endsWith('oes')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) {
    return word.slice(0, -1);
  }
  return word;
}

/** Lowercases, strips punctuation and makes each word singular. */
export function normalize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular);
}

/**
 * An item satisfies a term when every word of the term appears in the
 * item's name. So "large eggs" satisfies "egg", and "sharp cheddar cheese"
 * satisfies "cheddar cheese", but "cheese" alone does not satisfy
 * "cheddar cheese".
 */
export function itemSatisfies(itemName: string, term: string): boolean {
  const itemWords = new Set(normalize(itemName));
  const termWords = normalize(term);
  return termWords.length > 0 && termWords.every((w) => itemWords.has(w));
}

function isStaple(ingredient: RecipeIngredient, staples: string[]): boolean {
  const words = normalize(ingredient.name).join(' ');
  return staples.some((s) => normalize(s).join(' ') === words);
}

function findItem(ingredient: RecipeIngredient, pantry: PantryEntry[]): PantryEntry | undefined {
  const terms = [ingredient.name, ...(ingredient.alternatives ?? [])];
  return pantry.find((item) => item.quantity > 0 && terms.some((t) => itemSatisfies(item.name, t)));
}

export interface MatchOptions {
  staples?: string[];
  /** Returns true when an item is expired or expiring soon. */
  isExpiringSoon?: (item: PantryEntry) => boolean;
}

export function matchRecipe(recipe: Recipe, pantry: PantryEntry[], options: MatchOptions = {}): RecipeMatch {
  const staples = options.staples ?? DEFAULT_STAPLES;
  const ingredients: IngredientMatch[] = recipe.ingredients.map((ingredient) => {
    const matchedItem = findItem(ingredient, pantry);
    if (matchedItem) return { ingredient, status: 'have', matchedItem };
    if (isStaple(ingredient, staples)) return { ingredient, status: 'staple' };
    if (ingredient.optional) return { ingredient, status: 'optional-missing' };
    return { ingredient, status: 'missing' };
  });

  const haveCount = ingredients.filter((i) => i.status === 'have' && !i.ingredient.optional && !isStaple(i.ingredient, staples)).length;
  const missingCount = ingredients.filter((i) => i.status === 'missing').length;
  const used = new Set(ingredients.filter((i) => i.matchedItem).map((i) => i.matchedItem!));
  const expiringUsed = options.isExpiringSoon ? [...used].filter(options.isExpiringSoon).length : 0;
  const denom = haveCount + missingCount;

  return {
    recipe,
    ingredients,
    haveCount,
    missingCount,
    expiringUsed,
    score: denom === 0 ? 0 : haveCount / denom,
  };
}

/**
 * Ranks recipes: fewest missing ingredients first, then ones that use up
 * food expiring soon, then the best overall match. Recipes that use none of
 * your food are dropped.
 */
export function suggestRecipes(recipes: Recipe[], pantry: PantryEntry[], options: MatchOptions = {}): RecipeMatch[] {
  return recipes
    .map((r) => matchRecipe(r, pantry, options))
    .filter((m) => m.haveCount > 0)
    .sort(
      (a, b) =>
        a.missingCount - b.missingCount ||
        b.expiringUsed - a.expiringUsed ||
        b.score - a.score ||
        a.recipe.minutes - b.recipe.minutes,
    );
}
