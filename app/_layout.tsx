import { Stack } from 'expo-router';
import { DrawerProvider } from './components/DrawerContext';
import DrawerMenu from './components/DrawerMenu';

export default function RootLayout() {
  return (
    <DrawerProvider drawerContent={<DrawerMenu />}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="screens/SplashScreen" />
    </DrawerProvider>
  );
}
