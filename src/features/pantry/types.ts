export type LocationKind = 'food' | 'room';

export interface Location {
  id: number;
  name: string;
  kind: LocationKind;
  sort_order: number;
}

export interface Item {
  id: number;
  location_id: number;
  location_name: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  expires_on: string | null; // YYYY-MM-DD
  notes: string | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  location_id: number;
  name: string;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  expires_on?: string | null;
  notes?: string | null;
}
