import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuItem = {
  label: string;
  category?: string;
  route?: string;
};

export default function DrawerMenu() {
  const router = useRouter();

  const handleNavigate = (title: string) => {
    router.push(`/(auth)/ProductByCategory?category=${encodeURIComponent(title)}`);
  };

  const menuItems: MenuItem[] = [
    { label: 'Thông báo' }, //chưa có màn
    { label: 'Áo thun', category: 'Áo thun' },
    { label: 'Áo khoác', category: 'Áo khoác' },
    { label: 'Áo sơ mi', category: 'Áo sơ mi' },
    { label: 'Áo hoodie', category: 'Áo hoodie' },
    { label: 'ChatBot', route: '/(tabs)/Chat' },
  ];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logomaloze.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>-------Manzone Poly------</Text>
      <Text style={styles.section}>Danh mục</Text>

      {menuItems.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.menuItem}
          onPress={() => {
            if (item.category) {
              handleNavigate(item.category);
            } else if (item.route) {
              router.push(item.route as any);
            } else {
              Alert.alert('Thông báo', 'Chức năng đang phát triển');
            }
          }}
        >
          <Text>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  section: { fontWeight: 'bold', fontSize: 20, marginBottom: 10, color:'red'  },
  menuItem: { paddingVertical: 18, borderBottomWidth: 1, borderColor: '#eee',},
  logo: {
    width: 200,
    height: 100,
    marginBottom: 0,
  },
});
