import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AxiosError } from 'axios';
import { BASE_URL } from '../src/config';

interface PendingRegister {
        full_name: string;
        password: string;
    }

export default function OTPVerifyScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<PendingRegister | null>(null);

    
    useEffect(() => {
        const fetchData = async () => {
            const raw = await AsyncStorage.getItem("pendingRegister");
            if (!raw) return router.replace("/(auth)/RegisterScreen");
            const data = JSON.parse(raw);
            if (!data || data.email !== email) {
                Alert.alert("Lỗi", "Email không khớp");
                return;
            }
            setUserData(data);
        };
        fetchData();
    }, []);

    const handleVerify = async () => {
        if (!otp || otp.length !== 6)
            return Alert.alert("Lỗi", "OTP phải đủ 6 chữ số");

        if (!userData) {
            Alert.alert("Lỗi", "Thiếu thông tin đăng ký");
            return;
        }

        try {
            setLoading(true);

            await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
                email,
                otp,
                full_name: userData.full_name,
                password: userData.password,
            });

            await AsyncStorage.removeItem("pendingRegister");

            Alert.alert("Thành công", "Xác minh thành công. Vui lòng đăng nhập.");
            router.replace('/(auth)/LoginScreen');

        } catch (err) {
            const error = err as AxiosError<any>;
            const msg = error.response?.data?.message || 'Đăng ký thất bại';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Xác minh OTP</Text>
            <Text style={styles.subTitle}>
                Nhập mã xác minh đã gửi đến email: {email}
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Mã OTP (6 chữ số)"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: otp.length === 6 ? '#2e5ae1' : '#ccc' }]}
                onPress={handleVerify}
                disabled={loading || otp.length !== 6}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Đang xác minh..." : "Xác minh"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    subTitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 13,
        marginBottom: 20,
        fontSize: 18,
        textAlign: 'center',
    },
    button: {
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});
