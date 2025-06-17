import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo, AntDesign, FontAwesome } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [user, setUser] = useState({
    name: 'Name User',
    avatar: 'https://tse1.mm.bing.net/th?id=OIP.nRbqJgggShiTGvXdOJDTogHaHa&pid=Api&P=0&h=220',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        //  Giả lập gọi API lấy user info (có thể thay bằng API thật sau này)
        const response = await new Promise<{ name: string; avatar: string }>((resolve) =>
          setTimeout(() => resolve({
            name: 'Nguyễn Văn A',
            avatar: 'https://tse1.mm.bing.net/th?id=OIP.nRbqJgggShiTGvXdOJDTogHaHa&pid=Api&P=0&h=220',
          }), 1000)
        );
        setUser(response);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    setLogoutVisible(false);
    // 👉 Chuyển hướng về màn hình login
    router.replace('/Login'); // hoặc router.push('/login') nếu bạn không muốn xóa stack
  };

  return (
    <View style={{ flex: 1 }}>
       {/* Modal xác nhận đăng xuất */}
        <Modal
          visible={logoutVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoutVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 16, marginBottom: 10 }}>Bạn có chắc muốn đăng xuất?</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleLogout} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Đăng xuất</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setLogoutVisible(false)} style={styles.modalBtnCancel}>
                  <Text style={styles.modalBtnTextCancel}>Huỷ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.welcome}>Chào mừng đến với ứng dụng</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutVisible(true)}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Order status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn của tôi</Text>
          <View style={styles.orderRow}>
            <OrderStatus iconLib="AntDesign" icon="reload1" text="Đang xử lý" />
            <OrderStatus iconLib="FontAwesome5" icon="truck" text="Đang giao" />
            <OrderStatus iconLib="AntDesign" icon="checkcircleo" text="Đã giao" />
            <OrderStatus iconLib="AntDesign" icon="closecircleo" text="Đã huỷ" />
          </View>
        </View>

        {/* Tài khoản */}
        <AccountSection
          title="Tài khoản"
          items={[
            { icon: 'person', label: 'Thông tin cá nhân' },
            { icon: 'lock-closed', label: 'Đổi mật khẩu' },
            { icon: 'location', label: 'Quản lý sổ địa chỉ' },
            { icon: 'language', label: 'Ngôn ngữ' },
          ]}
        />

        {/* Về ManzonePoly */}
        <AccountSection
          title="Về ManzonePoly"
          items={[
            { icon: 'storefront', label: 'Giới thiệu cửa hàng' },
            { icon: 'document-text', label: 'Giấy phép kinh doanh' },
            { icon: 'document', label: 'Chính sách' },
            { icon: 'refresh', label: 'Chính sách đổi trả' },
            { icon: 'car', label: 'Chính sách giao hàng' },
          ]}
        />
        
      

     
        
        </ScrollView>
    </View>
  );
}

// ✅ Component OrderStatus
const OrderStatus = ({ iconLib, icon, text }: { iconLib: string; icon: string; text: string }) => {
  let IconComponent;

  switch (iconLib) {
    case 'AntDesign':
      IconComponent = AntDesign;
      break;
    case 'FontAwesome5':
      IconComponent = FontAwesome5;
      break;
    case 'FontAwesome':
      IconComponent = FontAwesome;
      break;
    case 'MaterialIcons':
      IconComponent = MaterialIcons;
      break;
    default:
      IconComponent = AntDesign;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <IconComponent name={icon as any} size={24} color="#0039e6" />
      <Text style={{ color: '#0039e6', marginTop: 4 }}>{text}</Text>
    </View>
  );
};

// ✅ Component danh mục tài khoản
const AccountSection = ({
  title,
  items,
}: {
  title: string;
  items: { icon: string; label: string }[];
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.box}>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.row}>
          <Ionicons name={item.icon as any} size={20} color="#0039e6" />
          <Text style={styles.rowText}>{item.label}</Text>
          <Entypo name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    backgroundColor: '#f66',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  welcome: {
    color: '#fff',
    fontSize: 13,
  },
  logoutBtn: {
    marginLeft: 'auto',
    backgroundColor: '#f99',
    padding: 8,
    borderRadius: 20,
  },
  section: { padding: 20 },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0039e6',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    marginLeft: 10,
    color: '#333',
  },
  // Modal styles
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    alignItems: 'center',

  },
  modalBtn: {
    backgroundColor: '#f66',
    padding: 10,
    margin:10,
    borderRadius: 5,
    minWidth: 135,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBtnCancel: {
    backgroundColor: '#eee',
    padding: 10,
    margin:10,
    borderRadius: 5,
    minWidth: 135,
    alignItems: 'center',
  },
  modalBtnTextCancel: {
    color: '#333',
    fontWeight: 'bold',
  },
});
