import { useMemo } from 'react';
import { useFoodInventory } from '@/features/pantry/hooks';
import { expiryStatus } from '@/features/pantry/expiry';
import { RECIPES } from './data';
import { matchRecipe, suggestRecipes, type MatchOptions } from './match';
import type { PantryEntry, Recipe } from './types';

const options: MatchOptions = {
  isExpiringSoon: (item: PantryEntry) => ['expired', 'soon'].includes(expiryStatus(item.expires_on)),
};

export function useRecipeSuggestions() {
  const { items, loading } = useFoodInventory();
  const suggestions = useMemo(() => suggestRecipes(RECIPES, items, options), [items]);
  return { suggestions, loading, hasItems: items.length > 0 };
}

export function useRecipeMatch(recipe: Recipe | undefined) {
  const { items } = useFoodInventory();
  return useMemo(() => (recipe ? matchRecipe(recipe, items, options) : undefined), [recipe, items]);
}
