import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Chuông
import { Feather } from '@expo/vector-icons';  // Menu
import { useDrawer } from './DrawerContext';   // 
import { useNotifications } from "../src/NotificationContext";
import { useRouter } from "expo-router";

const TopBar = () => {
  const { openDrawer } = useDrawer(); // Lấy hàm mở menu
  const { unreadCount } = useNotifications();
  const router = useRouter();
  

  return (
    <View style={styles.topBar}>
      {/* Menu icon */}
      <TouchableOpacity onPress={openDrawer}>
        <Feather name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Logo */}
      <Text style={styles.logo}>
        <Text style={{ color: 'black', fontWeight: 'bold' }}>Manzone</Text>
        <Text style={{ color: '#fff' }}>Poly</Text>
      </Text>

      {/* Notification icon */}
      <TouchableOpacity onPress={() => router.push("/(auth)/NotificationScreen")}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#ff4d4f',
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: '#4d85ffff',
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});

export default TopBar;
