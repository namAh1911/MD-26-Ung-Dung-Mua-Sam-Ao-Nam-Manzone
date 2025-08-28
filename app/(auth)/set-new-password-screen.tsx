import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { resetPassword } from '../src/services/password';

export default function SetNewPasswordScreen() {
  const router = useRouter();
  const { email: emailParam, otp: otpParam } = useLocalSearchParams<{ email?: string; otp?: string }>();
  const [email] = useState(String(emailParam || '').trim().toLowerCase());
  const [otp] = useState(String(otpParam || '').trim());
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || otp.length !== 6) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lại email và OTP.');
      router.replace('/(auth)/forgot-password-screen' as any);
    }
  }, [email, otp]);

  const handleReset = async () => {
    if (pw.length < 6) return Alert.alert('Lỗi', 'Mật khẩu phải từ 6 ký tự');
    if (pw !== pw2) return Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');

    try {
      setLoading(true);
      await resetPassword(email, otp, pw);
      Alert.alert('Thành công', 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.');
      router.replace('/(auth)/LoginScreen' as any);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đặt lại mật khẩu thất bại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Tạo mật khẩu mới</Text>
      <Text style={s.subTitle}>Email: {email} • OTP: {otp}</Text>

      <TextInput style={s.inputText} placeholder="Mật khẩu mới" secureTextEntry value={pw} onChangeText={setPw} />
      <TextInput style={s.inputText} placeholder="Nhập lại mật khẩu" secureTextEntry value={pw2} onChangeText={setPw2} />

      <TouchableOpacity
        style={[s.button, { backgroundColor: otp.length === 6 && pw && pw2 ? '#2e5ae1' : '#ccc' }]}
        onPress={handleReset}
        disabled={loading || otp.length !== 6 || !pw || !pw2}
      >
        <Text style={s.buttonText}>{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,justifyContent:'center',padding:20,backgroundColor:'#fff'},
  title:{fontSize:24,fontWeight:'bold',marginBottom:10,textAlign:'center'},
  subTitle:{fontSize:14,color:'#666',marginBottom:20,textAlign:'center'},
  inputText:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:13,marginBottom:12,fontSize:16},
  button:{padding:15,borderRadius:6,alignItems:'center',marginTop:8},
  buttonText:{color:'#fff',fontWeight:'bold'},
});
