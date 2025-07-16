// app/_layout.tsx
import { Stack } from 'expo-router';
import { DrawerProvider } from './components/DrawerContext';
import DrawerMenu from './components/DrawerMenu';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <DrawerProvider drawerContent={<DrawerMenu />}>
        <Stack screenOptions={{ headerShown: false }} />
      </DrawerProvider>
    </PaperProvider>
  );
}
