import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { listFoodItems, listLocations } from './repository';
import type { Item, Location } from './types';

/** Loads food locations and items, and reloads whenever the screen regains focus. */
export function useFoodInventory() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [nextItems, nextLocations] = await Promise.all([listFoodItems(db), listLocations(db, 'food')]);
    setItems(nextItems);
    setLocations(nextLocations);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { db, items, locations, loading, reload };
}
