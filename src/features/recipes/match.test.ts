/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemSatisfies, matchRecipe, normalize, suggestRecipes } from './match.ts';
import { RECIPES } from './data.ts';
import { expiryStatus, expiryLabel, addDays } from '../pantry/expiry.ts';
import type { PantryEntry } from './types.ts';

const item = (name: string, quantity = 1, expires_on: string | null = null): PantryEntry => ({
  name,
  quantity,
  expires_on,
});

test('normalize lowercases and singularizes', () => {
  assert.deepEqual(normalize('Large Eggs'), ['large', 'egg']);
  assert.deepEqual(normalize('Tomatoes'), ['tomato']);
  assert.deepEqual(normalize('Fresh berries!'), ['fresh', 'berry']);
  assert.deepEqual(normalize('Hummus'), ['hummus']);
});

test('item names that are more specific still satisfy the ingredient', () => {
  assert.ok(itemSatisfies('Large eggs', 'egg'));
  assert.ok(itemSatisfies('Sharp cheddar cheese', 'cheddar cheese'));
  assert.ok(!itemSatisfies('Cheese', 'cheddar cheese'));
  assert.ok(!itemSatisfies('Eggplant', 'egg'));
});

test('staples and optional ingredients are never counted as missing', () => {
  const omelette = RECIPES.find((r) => r.id === 'cheese-omelette')!;
  const m = matchRecipe(omelette, [item('eggs', 6), item('cheddar'), item('butter')]);
  // "cheddar" alone does not satisfy "cheese"
  assert.equal(m.missingCount, 1);
  const m2 = matchRecipe(omelette, [item('eggs', 6), item('cheddar cheese'), item('butter')]);
  assert.equal(m2.missingCount, 0);
  assert.equal(m2.ingredients.find((i) => i.ingredient.name === 'salt')!.status, 'staple');
  assert.equal(m2.ingredients.find((i) => i.ingredient.name === 'spinach')!.status, 'optional-missing');
});

test('items with zero quantity do not count', () => {
  const omelette = RECIPES.find((r) => r.id === 'cheese-omelette')!;
  const m = matchRecipe(omelette, [item('eggs', 0), item('cheese'), item('butter')]);
  assert.equal(m.missingCount, 1);
});

test('alternatives match (spaghetti counts as pasta)', () => {
  const pasta = RECIPES.find((r) => r.id === 'garlic-pasta')!;
  const m = matchRecipe(pasta, [item('Spaghetti'), item('garlic')]);
  assert.equal(m.missingCount, 0);
});

test('suggestions rank fewest missing first, then expiring food', () => {
  const soon = addDays(1);
  const pantry = [item('eggs', 6), item('bread'), item('butter'), item('milk', 1, soon), item('banana', 3)];
  const results = suggestRecipes(RECIPES, pantry, {
    isExpiringSoon: (i) => ['expired', 'soon'].includes(expiryStatus(i.expires_on)),
  });
  assert.ok(results.length > 0);
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i - 1].missingCount <= results[i].missingCount);
  }
  // French toast uses the milk that expires tomorrow, scrambled eggs only uses it optionally
  const ready = results.filter((r) => r.missingCount === 0).map((r) => r.recipe.id);
  assert.ok(ready.includes('french-toast'));
  assert.ok(ready.includes('scrambled-eggs'));
  assert.ok(ready.includes('banana-smoothie'));
  // Recipes that use nothing you have are dropped
  assert.ok(!results.some((r) => r.recipe.id === 'greek-salad'));
});

test('every recipe has ingredients and steps', () => {
  const ids = new Set<string>();
  for (const r of RECIPES) {
    assert.ok(!ids.has(r.id), `duplicate id ${r.id}`);
    ids.add(r.id);
    assert.ok(r.ingredients.length > 0 && r.steps.length > 0, r.id);
  }
});

test('expiry helpers', () => {
  const today = new Date(2026, 10, 20);
  assert.equal(expiryStatus(null, today), 'none');
  assert.equal(expiryStatus('2026-11-19', today), 'expired');
  assert.equal(expiryStatus('2026-11-22', today), 'soon');
  assert.equal(expiryStatus('2026-12-20', today), 'ok');
  assert.equal(expiryLabel('2026-11-21', today), 'Expires tomorrow');
  assert.equal(expiryLabel('2026-11-17', today), 'Expired 3 days ago');
  assert.equal(expiryStatus('not-a-date', today), 'none');
});
