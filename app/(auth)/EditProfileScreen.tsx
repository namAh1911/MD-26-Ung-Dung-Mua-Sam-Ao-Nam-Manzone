import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../src/config';

export default function EditProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState(0);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data;
        setFullName(user.full_name || '');
        setPhoneNumber(user.phone_number || '');
        setGender(user.gender || 0);
        setEmail(user.email);
        setAvatarUrl(user.avatar_url || '');
        if (user.date_of_birth) setDateOfBirth(new Date(user.date_of_birth));
      } catch (error) {
        const axiosErr = error as AxiosError;
        console.log('Lỗi khi lấy thông tin người dùng:', axiosErr?.response?.data || axiosErr?.message);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/api/users/update-profile`,
        {
          full_name: fullName,
          phone_number: phoneNumber,
          gender,
          date_of_birth: dateOfBirth,
          avatar_url: avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      router.back();
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.log('Lỗi cập nhật:', axiosErr?.response?.data || axiosErr?.message);
      Alert.alert('Lỗi', 'Cập nhật thất bại');
    }
  };

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Lỗi', 'Bạn cần cho phép truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];
      const extension = image.uri.split('.').pop();
      const fileType = `image/${extension}`;

      const formData = new FormData();
      formData.append('avatar', {
        uri: image.uri,
        name: `avatar.${extension}`,
        type: fileType,
      } as any); // thêm `as any` để tránh lỗi TypeScript khi dùng trong Expo


      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Lỗi', 'Chưa đăng nhập hoặc token đã hết hạn');
          return;
        }

        const res = await axios.post(`${BASE_URL}/api/upload/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          transformRequest: (data, headers) => {
            return data; // bắt buộc với Expo để gửi đúng multipart
          },
        });


        const uploadedUrl = res.data.url;
        console.log('Uploaded avatar URL:', uploadedUrl);
        setAvatarUrl(uploadedUrl);
      } catch (error) {
        const axiosErr = error as AxiosError;
        console.error('Upload error:', axiosErr?.response?.data || axiosErr?.message);
        Alert.alert('Lỗi', 'Không thể tải ảnh lên');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin cá nhân</Text>
      <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image
            key={avatarUrl} // Force re-render if avatar URL changes
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <Image
            source={require('../../assets/images/react-logo.png')}
            style={styles.avatar}
          />
        )}
        <View style={styles.editIcon}>
          <Text style={{ color: '#fff', fontSize: 14 }}>✎</Text>
        </View>
      </TouchableOpacity>


      <Text style={styles.profileLabel}>Profile</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} editable={false} />

      <Text style={styles.label}>Họ và Tên</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Số điện thoại</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Giới tính</Text>
      <View style={styles.genderRow}>
        <RadioButton.Android
          value="1"
          status={gender === 1 ? 'checked' : 'unchecked'}
          onPress={() => setGender(1)}
        />
        <Text style={styles.genderText}>Nam</Text>
        <RadioButton.Android
          value="2"
          status={gender === 2 ? 'checked' : 'unchecked'}
          onPress={() => setGender(2)}
        />
        <Text style={styles.genderText}>Nữ</Text>
        <RadioButton.Android
          value="3"
          status={gender === 3 ? 'checked' : 'unchecked'}
          onPress={() => setGender(3)}
        />
        <Text style={styles.genderText}>Khác</Text>
      </View>

      <Text style={styles.label}>Ngày sinh</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          style={styles.input}
          value={dateOfBirth.toLocaleDateString('vi-VN')}
          editable={false}
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDateOfBirth(selectedDate);
          }}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Cập Nhật</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  avatarWrapper: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2e5ae1',
    padding: 6,
    borderRadius: 20,
  },
  profileLabel: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e5ae1',
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  genderText: {
    marginRight: 20,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#f66',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
