import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useRecipeSuggestions } from '@/features/recipes/hooks';
import type { RecipeMatch } from '@/features/recipes/types';
import { Badge, Chip, EmptyState } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const TAGS = ['all', 'quick', 'breakfast', 'lunch', 'dinner', 'vegetarian'];

export default function RecipesScreen() {
  const { suggestions, loading, hasItems } = useRecipeSuggestions();
  const [tag, setTag] = useState('all');

  const sections = useMemo(() => {
    const filtered = tag === 'all' ? suggestions : suggestions.filter((s) => s.recipe.tags.includes(tag));
    const ready = filtered.filter((s) => s.missingCount === 0);
    const almost = filtered.filter((s) => s.missingCount > 0 && s.missingCount <= 2);
    const more = filtered.filter((s) => s.missingCount > 2);
    return [
      { title: 'Ready to cook', data: ready },
      { title: 'Missing 1 or 2 things', data: almost },
      { title: 'Worth a shopping trip', data: more },
    ].filter((s) => s.data.length > 0);
  }, [suggestions, tag]);

  return (
    <View style={styles.screen}>
      <View style={styles.chips}>
        {TAGS.map((t) => (
          <Chip key={t} label={t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)} selected={tag === t} onPress={() => setTag(t)} />
        ))}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.recipe.id}
        contentContainerStyle={sections.length ? styles.list : styles.listEmpty}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => <RecipeCard match={item} />}
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              title={hasItems ? 'No matches yet' : 'Add some food first'}
              body={
                hasItems
                  ? 'None of the built-in recipes use what you have. Try another filter or add more items.'
                  : 'Recipes are suggested from what is in your kitchen. Add a few items on the Kitchen tab.'
              }
            />
          )
        }
      />
    </View>
  );
}

function RecipeCard({ match }: { match: RecipeMatch }) {
  const missing = match.ingredients.filter((i) => i.status === 'missing').map((i) => i.ingredient.name);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: match.recipe.id } })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.title}>{match.recipe.title}</Text>
        <Text style={styles.minutes}>{match.recipe.minutes} min</Text>
      </View>
      <View style={styles.badges}>
        {match.missingCount === 0 ? (
          <Badge label="You have everything" tone="ok" />
        ) : (
          <Badge label={`Need ${missing.join(', ')}`} tone="muted" />
        )}
        {match.expiringUsed > 0 ? (
          <Badge label={`Uses ${match.expiringUsed} item${match.expiringUsed > 1 ? 's' : ''} expiring soon`} tone="warn" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  minutes: { color: colors.muted, fontSize: 13 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
