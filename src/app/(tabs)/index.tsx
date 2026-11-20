import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useFoodInventory } from '@/features/pantry/hooks';
import { setQuantity } from '@/features/pantry/repository';
import { expiryLabel, expiryStatus } from '@/features/pantry/expiry';
import type { Item } from '@/features/pantry/types';
import { Badge, Chip, EmptyState } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

type Filter = 'all' | 'expiring' | number;

function formatQty(item: Item) {
  const q = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2).replace(/0+$/, '');
  return item.unit ? `${q} ${item.unit}` : `× ${q}`;
}

export default function KitchenScreen() {
  const { db, items, locations, loading, reload } = useFoodInventory();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const expiringCount = useMemo(
    () => items.filter((i) => ['expired', 'soon'].includes(expiryStatus(i.expires_on))).length,
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'expiring' && !['expired', 'soon'].includes(expiryStatus(item.expires_on))) return false;
      if (typeof filter === 'number' && item.location_id !== filter) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, query]);

  async function bump(item: Item, delta: number) {
    await setQuantity(db, item.id, item.quantity + delta);
    reload();
  }

  const openItem = (id?: number) =>
    router.push(id ? { pathname: '/item/edit', params: { id: String(id) } } : '/item/edit');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your food"
          placeholderTextColor={colors.muted}
          style={styles.search}
          clearButtonMode="while-editing"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip
            label={expiringCount ? `Use soon (${expiringCount})` : 'Use soon'}
            selected={filter === 'expiring'}
            onPress={() => setFilter('expiring')}
          />
          {locations.map((loc) => (
            <Chip key={loc.id} label={loc.name} selected={filter === loc.id} onPress={() => setFilter(loc.id)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={visible.length ? styles.list : styles.listEmpty}
        ListEmptyComponent={
          loading ? undefined : items.length === 0 ? (
            <EmptyState
              title="Your kitchen is empty"
              body="Add what's in your pantry, fridge and freezer, and we'll suggest recipes you can make."
            />
          ) : (
            <EmptyState title="Nothing here" body="No items match this filter." />
          )
        }
        renderItem={({ item }) => {
          const status = expiryStatus(item.expires_on);
          const label = expiryLabel(item.expires_on);
          const out = item.quantity <= 0;
          return (
            <Pressable onPress={() => openItem(item.id)} style={[styles.row, out && { opacity: 0.55 }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{item.location_name}</Text>
                  {out ? (
                    <Badge label="Out" tone="muted" />
                  ) : label ? (
                    <Badge
                      label={label}
                      tone={status === 'expired' ? 'danger' : status === 'soon' ? 'warn' : 'ok'}
                    />
                  ) : null}
                </View>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  hitSlop={8}
                  onPress={() => bump(item, -1)}
                  style={styles.stepBtn}
                  accessibilityLabel={`Use one ${item.name}`}
                >
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.qty}>{formatQty(item)}</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => bump(item, 1)}
                  style={styles.stepBtn}
                  accessibilityLabel={`Add one ${item.name}`}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => openItem()} accessibilityLabel="Add item">
        <Text style={styles.fabText}>＋ Add item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  metaText: { color: colors.muted, fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, color: colors.primary, fontWeight: '600' },
  qty: { minWidth: 44, textAlign: 'center', color: colors.text, fontVariant: ['tabular-nums'] },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
});
