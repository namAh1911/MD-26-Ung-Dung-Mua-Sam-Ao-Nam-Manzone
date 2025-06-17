import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleRegister = () => {
    if (!name || !phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    // TODO: Gửi API tạo tài khoản

    // Nếu thành công, chuyển sang login hoặc home:
    router.replace('/Login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.replace('/screens/LoginScreen') // router.back(); // hoặc
          }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐĂNG KÝ</Text>
      </View>

      {/* Nội dung */}
      <View style={styles.content}>
        <Text style={styles.title}>NHẬP THÔNG TIN CỦA BẠN</Text>
        <Text style={styles.sub}>Vui lòng nhập mật khẩu để đăng nhập</Text>

        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ tên"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Nhập mật khẩu"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: name && phone && password ? '#2e5ae1' : '#ccc' }]}
          disabled={!name || !phone || !password}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>Đăng ký</Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Bạn chưa có tài khoản?{' '}
          <Text style={styles.loginLink} onPress={() => router.push('/Login')}>Đăng nhập</Text>
        </Text>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.or}>Hoặc</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.googleButton}>
          <AntDesign name="google" size={24} color="#EA4335" style={{ marginRight: 8 }} />
          <Text>Tiếp tục với Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#f66',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: { padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  sub: { color: '#555', marginBottom: 20 },
  label: { marginTop: 15, color: '#555', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 13,
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    marginTop: 5,
    padding: 3,
    justifyContent: 'space-between',
  },
  button: {
    padding: 15,
    borderRadius: 6,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loginText: { textAlign: 'center', marginTop: 20 },
  loginLink: { color: '#2e5ae1', fontWeight: 'bold' },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  or: {
    marginHorizontal: 10,
    color: '#999',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
