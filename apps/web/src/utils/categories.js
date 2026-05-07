import { Car, Truck, Box, Wrench, Plane, Package, ShoppingBag, LayoutGrid } from 'lucide-react';

/**
 * Single source of truth for listing categories.
 * These are the exact strings stored in the database.
 * Translation is handled by td() from useLanguage — add new Arabic
 * mappings in translations.js under the `values` key.
 */
export const LISTING_CATEGORIES = [
  'Hot Wheels',
  'Matchbox',
  'RC Cars',
  'DIY Garages',
  'Planes',
  'Miniatures',
  'Bazaar',
  'Others',
];

/**
 * Condition values stored in the database.
 * Translation handled by td() — add Arabic mappings in translations.js > values.
 */
export const LISTING_CONDITIONS = [
  'Mint',
  'Near Mint',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
];

/** Icon component mapped to each category key. */
export const CATEGORY_ICONS = {
  'Hot Wheels': Car,
  'Matchbox':   Truck,
  'RC Cars':    Box,
  'DIY Garages': Wrench,
  'Planes':     Plane,
  'Miniatures': Package,
  'Bazaar':     ShoppingBag,
  'Others':     LayoutGrid,
};
