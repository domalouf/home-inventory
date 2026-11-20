import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { createItem, deleteItem, getItem, listLocations, updateItem } from '@/features/pantry/repository';
import { addDays, parseDate } from '@/features/pantry/expiry';
import type { Location } from '@/features/pantry/types';
import { Button, Chip } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

const UNITS = ['', 'g', 'kg', 'ml', 'L', 'pack', 'can', 'bottle', 'bag'];
const EXPIRY_PRESETS: { label: string; days: number | null }[] = [
  { label: 'None', days: null },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '6 months', days: 182 },
];

export default function EditItemScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : undefined;

  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState<number | null>(null);
  const [quantity, setQuantityText] = useState('1');
  const [unit, setUnit] = useState('');
  const [expires, setExpires] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const locs = await listLocations(db, 'food');
      setLocations(locs);
      if (id) {
        const item = await getItem(db, id);
        if (item) {
          setName(item.name);
          setLocationId(item.location_id);
          setQuantityText(String(item.quantity));
          setUnit(item.unit ?? '');
          setExpires(item.expires_on ?? '');
          setNotes(item.notes ?? '');
          return;
        }
      }
      setLocationId(locs[0]?.id ?? null);
    })();
  }, [db, id]);

  async function save() {
    const qty = Number(quantity.replace(',', '.'));
    if (!name.trim()) return setError('Give the item a name.');
    if (locationId === null) return setError('Pick where it is kept.');
    if (!Number.isFinite(qty) || qty < 0) return setError('Quantity must be a number.');
    if (expires && !parseDate(expires)) return setError('Use the date format YYYY-MM-DD.');

    const input = {
      name,
      location_id: locationId,
      quantity: qty,
      unit: unit || null,
      expires_on: expires || null,
      notes: notes.trim() || null,
    };
    if (id) await updateItem(db, id, input);
    else await createItem(db, input);
    router.back();
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert('Delete item?', `Remove ${name} from your kitchen?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(db, id);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: id ? 'Edit item' : 'Add item' }} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Eggs, Cheddar cheese, Spaghetti"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoFocus={!id}
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="Kept in">
          <View style={styles.chips}>
            {locations.map((loc) => (
              <Chip key={loc.id} label={loc.name} selected={locationId === loc.id} onPress={() => setLocationId(loc.id)} />
            ))}
          </View>
        </Field>

        <Field label="Quantity">
          <TextInput
            value={quantity}
            onChangeText={setQuantityText}
            keyboardType="decimal-pad"
            style={[styles.input, { width: 120 }]}
          />
          <View style={[styles.chips, { marginTop: spacing.sm }]}>
            {UNITS.map((u) => (
              <Chip key={u || 'none'} label={u || 'count'} selected={unit === u} onPress={() => setUnit(u)} />
            ))}
          </View>
        </Field>

        <Field label="Use by">
          <View style={styles.chips}>
            {EXPIRY_PRESETS.map((p) => {
              const value = p.days === null ? '' : addDays(p.days);
              return (
                <Chip key={p.label} label={p.label} selected={expires === value} onPress={() => setExpires(value)} />
              );
            })}
          </View>
          <TextInput
            value={expires}
            onChangeText={setExpires}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={[styles.input, { marginTop: spacing.sm }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={colors.muted}
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            multiline
          />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title={id ? 'Save changes' : 'Add to kitchen'} onPress={save} />
        {id ? <Button title="Delete item" variant="danger" onPress={confirmDelete} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
});
