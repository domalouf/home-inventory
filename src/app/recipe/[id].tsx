import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getRecipe } from '@/features/recipes/data';
import { useRecipeMatch } from '@/features/recipes/hooks';
import { normalize } from '@/features/recipes/match';
import type { IngredientMatch } from '@/features/recipes/types';
import { EmptyState } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const STATUS_GLYPH: Record<IngredientMatch['status'], string> = {
  have: '✓',
  staple: '•',
  missing: '✗',
  'optional-missing': '○',
};

const STATUS_NOTE: Record<IngredientMatch['status'], string | null> = {
  have: null,
  staple: 'pantry basic',
  missing: 'need to buy',
  'optional-missing': 'optional',
};

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = getRecipe(id);
  const match = useRecipeMatch(recipe);

  if (!recipe) return <EmptyState title="Recipe not found" body="It may have been removed." />;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: recipe.title }} />
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.meta}>
        {recipe.minutes} min · serves {recipe.servings} · {recipe.tags.join(', ')}
      </Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Ingredients</Text>
        {(match?.ingredients ?? recipe.ingredients.map((ingredient) => ({ ingredient, status: 'missing' as const }))).map(
          (row) => (
            <View key={row.ingredient.name} style={styles.ingredient}>
              <Text
                style={[
                  styles.glyph,
                  row.status === 'have' && { color: colors.primary },
                  row.status === 'missing' && { color: colors.danger },
                ]}
              >
                {STATUS_GLYPH[row.status]}
              </Text>
              <Text style={styles.ingredientText}>
                {row.ingredient.amount ? `${row.ingredient.amount} ` : ''}
                {row.ingredient.name}
                {'matchedItem' in row && row.matchedItem && normalize(row.matchedItem.name).join(' ') !== normalize(row.ingredient.name).join(' ') ? (
                  <Text style={styles.note}>  (your {row.matchedItem.name})</Text>
                ) : null}
                {STATUS_NOTE[row.status] ? <Text style={styles.note}>  {STATUS_NOTE[row.status]}</Text> : null}
              </Text>
            </View>
          ),
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Steps</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 14, marginTop: -spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: { fontSize: 17, fontWeight: '700', color: colors.text },
  ingredient: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  glyph: { width: 18, fontSize: 16, fontWeight: '700', color: colors.muted, textAlign: 'center' },
  ingredientText: { flex: 1, fontSize: 16, color: colors.text, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 13 },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.okBg,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontSize: 16, color: colors.text, lineHeight: 23 },
});
