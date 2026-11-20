export interface RecipeIngredient {
  /** Canonical ingredient name, e.g. "egg", "cheddar cheese". */
  name: string;
  /** Human-friendly amount, e.g. "2", "1 cup". */
  amount?: string;
  /** Other names that count as having this ingredient, e.g. ["spaghetti", "penne"] for "pasta". */
  alternatives?: string[];
  /** Nice to have; never counted as missing. */
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

/** The subset of an inventory item the matcher needs. */
export interface PantryEntry {
  name: string;
  quantity: number;
  expires_on: string | null;
}

export interface IngredientMatch {
  ingredient: RecipeIngredient;
  status: 'have' | 'staple' | 'missing' | 'optional-missing';
  /** The pantry item that satisfied it, if any. */
  matchedItem?: PantryEntry;
}

export interface RecipeMatch {
  recipe: Recipe;
  ingredients: IngredientMatch[];
  missingCount: number;
  haveCount: number;
  /** How many matched items expire within the "soon" window (or are already expired). */
  expiringUsed: number;
  /** have / (have + missing), ignoring staples and optional ingredients. */
  score: number;
}
