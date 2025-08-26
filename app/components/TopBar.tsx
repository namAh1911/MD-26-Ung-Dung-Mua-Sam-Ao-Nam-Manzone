import { Feather, Ionicons } from '@expo/vector-icons'; // Chuông
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDrawer } from './DrawerContext'; // Thêm dòng này

const TopBar = () => {
  const { openDrawer } = useDrawer(); // Lấy hàm mở menu

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
      <TouchableOpacity>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
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
});

export default TopBar;
