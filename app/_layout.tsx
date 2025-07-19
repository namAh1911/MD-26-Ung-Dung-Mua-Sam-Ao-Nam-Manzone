// app/_layout.tsx
import { Stack } from 'expo-router';
import { DrawerProvider } from './components/DrawerContext';
import DrawerMenu from './components/DrawerMenu';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/AuthContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider> 
        <DrawerProvider drawerContent={<DrawerMenu />}>
          <Stack screenOptions={{ headerShown: false }} />
        </DrawerProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
