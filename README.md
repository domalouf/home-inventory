# Home Inventory

A phone app for keeping track of what's in your home. The first feature is the kitchen: track what's in your pantry, fridge and freezer, see what's expiring, and get recipe suggestions from what you already have.

Built with Expo (React Native + TypeScript). Data is stored on the phone with SQLite, so it works offline with no account.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer, with Node 20+ installed:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with your phone camera (iPhone) or the Expo Go app (Android).

You can also run `npx expo start --web` to open it in a browser.

## What's in it

- **Kitchen tab:** add items with where they're kept, a quantity and a use-by date. Filter by Pantry, Fridge, Freezer or "Use soon", search, and tap − / + to update quantities as you cook and shop.
- **Recipes tab:** built-in recipes ranked by how few ingredients you're missing, with ones that use food expiring soon pushed up. Pantry basics (salt, pepper, oil, sugar, water) never count as missing.
- **Recipe page:** ingredients checked off against your kitchen, and the steps.

## Project layout

```
src/
  app/                  Screens (Expo Router: every file is a route)
    (tabs)/index.tsx    Kitchen list
    (tabs)/recipes.tsx  Recipe suggestions
    item/edit.tsx       Add / edit item (modal)
    recipe/[id].tsx     Recipe detail
  db/migrations.ts      SQLite schema, versioned with PRAGMA user_version
  features/
    pantry/             Item types, queries, expiry helpers
    recipes/            Recipe data and the matching/ranking logic
  ui/                   Shared components and theme
```

The database stores every tracked thing as an `item` in a `location`. Kitchen locations have `kind = 'food'`; rooms of the house will be `kind = 'room'`, so the planned room inventory, barcode scanning and camera features all write to the same table.

## Checks

```bash
npm run typecheck   # TypeScript
npm test            # recipe matching and expiry unit tests (Node test runner)
```

## Roadmap

- Barcode scanning to add items (expo-camera)
- Shopping list from missing recipe ingredients
- Room-by-room house inventory
- Recipes from an API or AI model instead of the built-in set
- First-person camera with computer vision to update inventory automatically
