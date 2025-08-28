import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendOtp } from '../src/services/password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState((emailParam || '').toString());
  const [loading, setLoading] = useState(false);

  const normEmail = email.trim().toLowerCase();
  const valid = useMemo(() => /\S+@\S+\.\S+/.test(normEmail), [normEmail]);

  const handleSend = async () => {
    if (!valid) return Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
    try {
      setLoading(true);
      await sendOtp(normEmail);
      Alert.alert('Thành công', 'Mã OTP đã được gửi. Vui lòng kiểm tra email!');
      router.push({ pathname: '/(auth)/verify-otp-screen', params: { email: normEmail } } as any);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gửi OTP thất bại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Quên mật khẩu</Text>
      <Text style={s.subTitle}>Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu</Text>

      <TextInput
        style={s.input}
        placeholder="Nhập email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[s.button, { backgroundColor: valid ? '#2e5ae1' : '#ccc' }]}
        onPress={handleSend}
        disabled={loading || !valid}
      >
        <Text style={s.buttonText}>{loading ? 'Đang gửi...' : 'Gửi OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,justifyContent:'center',padding:20,backgroundColor:'#fff'},
  title:{fontSize:24,fontWeight:'bold',marginBottom:10,textAlign:'center'},
  subTitle:{fontSize:14,color:'#666',marginBottom:20,textAlign:'center'},
  input:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:13,marginBottom:20,fontSize:18,textAlign:'center'},
  button:{padding:15,borderRadius:6,alignItems:'center'},
  buttonText:{color:'#fff',fontWeight:'bold'},
});
