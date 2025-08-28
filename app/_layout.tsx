// app/_layout.tsx
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { DrawerProvider } from './components/DrawerContext';
import DrawerMenu from './components/DrawerMenu';
import { AuthProvider } from './src/AuthContext';
import { CartProvider } from './src/CartContext';
import { SocketProvider } from "./src/SocketProvider";
import { NotificationProvider } from "./src/NotificationContext";

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
          <CartProvider>
          <DrawerProvider drawerContent={<DrawerMenu />}>
            <Stack screenOptions={{ headerShown: false }} />
          </DrawerProvider>
        </CartProvider>
        </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

