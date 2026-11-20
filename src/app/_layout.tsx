import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '@/db/migrations';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="home-inventory.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/edit" options={{ presentation: 'modal', title: 'Item' }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
      </Stack>
    </SQLiteProvider>
  );
}
