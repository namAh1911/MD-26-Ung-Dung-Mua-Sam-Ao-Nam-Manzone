import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendOtp } from '../src/services/password';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email] = useState(String(emailParam || '').trim().toLowerCase());
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // đếm ngược resend
  const [resendIn, setResendIn] = useState(60);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleContinue = () => {
    if (otp.trim().length !== 6) {
      return Alert.alert('Lỗi', 'OTP phải đủ 6 chữ số');
    }
    router.push({
      pathname: '/(auth)/set-new-password-screen',
      params: { email, otp: otp.trim() },
    } as any);
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      setLoading(true);
      await sendOtp(email);
      setResendIn(60);
      Alert.alert('Đã gửi lại OTP', 'Vui lòng kiểm tra email.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gửi lại OTP thất bại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Xác minh OTP</Text>
      <Text style={s.subTitle}>Nhập mã OTP đã gửi tới email: {email}</Text>

      <TextInput
        style={s.input}
        placeholder="Mã OTP (6 chữ số)"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={[s.button, { backgroundColor: otp.trim().length === 6 ? '#2e5ae1' : '#ccc' }]}
        onPress={handleContinue}
        disabled={loading || otp.trim().length !== 6}
      >
        <Text style={s.buttonText}>{loading ? 'Đang xử lý...' : 'Tiếp tục'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={[s.link, resendIn > 0 && { opacity: 0.6 }]}>
          Gửi lại OTP {resendIn > 0 ? `(${resendIn}s)` : ''}
        </Text>
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
  link:{color:'#2e5ae1',fontWeight:'bold'},
});
