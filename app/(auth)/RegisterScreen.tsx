import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AxiosError } from 'axios';
import { BASE_URL } from '../src/config';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Lỗi', 'Mật khẩu nhập lại không khớp');
    }

    try {
      // Gửi OTP đến email
      await axios.post(`${BASE_URL}/api/auth/register`, {
        full_name: fullName,
        email,
        password,
      });

      // Lưu dữ liệu tạm để dùng khi xác minh OTP
      await AsyncStorage.setItem("pendingRegister", JSON.stringify({
        full_name: fullName,
        email,
        password,
      }));

      Alert.alert("Thành công", "Đã gửi mã OTP đến email");
      router.push({
        pathname: '/(auth)/OTPVerifyScreen',
        params: { email }
      });

    } catch (err) {
          const error = err as AxiosError<any>;
          const msg = error.response?.data?.message || 'Đăng ký thất bại';
          Alert.alert('Lỗi', msg);
        }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/Register_LoginScreen')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐĂNG KÝ</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ tên"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
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

        <Text style={styles.label}>Nhập lại mật khẩu</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: fullName && email && password && confirmPassword ? '#2e5ae1' : '#ccc' }]}
          onPress={handleRegister}
          disabled={!fullName || !email || !password || !confirmPassword}
        >
          <Text style={styles.buttonText}>Gửi mã OTP</Text>
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
});
