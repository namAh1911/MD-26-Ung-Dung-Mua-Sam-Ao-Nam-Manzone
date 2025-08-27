

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/AuthContext';
import type { CommentDoc } from '../src/services/comments';
import { createComment, deleteComment, fetchComments, updateComment } from '../src/services/comments';


type Props = {
  productId: string;
  onChanged?: () => void; 
};

export default function ProductComments({ productId, onChanged }: Props) {
  const { token, user } = useAuth();
  const router = useRouter();
  const userId = (user as any)?.id || (user as any)?._id;
  const [items, setItems] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myComment, setMyComment] = useState<CommentDoc | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchComments(productId);
      setItems(list);
      const mine = list.find(c => {
        const uid = typeof c.user_id === 'object' ? (c.user_id as any)?._id : c.user_id;
        return uid === userId;
      }) || null;
      setMyComment(mine);
      if (mine) {
        setRating(mine.rating);
        setContent(mine.content);
      } else {
        setRating(0);
        setContent('');
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [productId, token]);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((acc, c) => acc + (c.rating || 0), 0);
    return +(sum / items.length).toFixed(1);
  }, [items]);

  const count = items.length;

  const submit = async () => {
    if (!token) {
      Alert.alert('Bạn cần đăng nhập để đánh giá');
      return;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert('Vui lòng chọn số sao (1-5)');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Vui lòng nhập nội dung đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      if (myComment?._id) {
        await updateComment(token, myComment._id, { content: content.trim(), rating });
        Alert.alert('Thành công', 'Đã cập nhật đánh giá');
      } else {
        await createComment(token, { product_id: productId, content: content.trim(), rating });
        Alert.alert('Thành công', 'Đã gửi đánh giá');
      }
      await load();
      onChanged && onChanged();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể gửi đánh giá';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const removeMine = async () => {
    if (!token || !myComment?._id) return;
    Alert.alert('Xóa đánh giá', 'Bạn có chắc chắn muốn xóa đánh giá của mình?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await deleteComment(token, myComment!._id);
          setMyComment(null);
          setRating(0);
          setContent('');
          await load();
          onChanged && onChanged();
        } catch (e: any) {
          const msg = e?.response?.data?.message || 'Không thể xóa đánh giá';
          Alert.alert('Lỗi', msg);
        }
      }}
    ]);
  };

  const renderStars = (value: number, size = 16) => (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name={value >= i + 1 ? 'star' : 'star-outline'} size={size} color={'#f5a623'} style={{ marginRight: 2 }} />
      ))}
    </View>
  );

  return (
    <View style={{ marginTop: 12 }}>
      {/* Summary */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {renderStars(Math.round(avg))}
        <Text style={{ marginLeft: 8, color: '#333' }}>{avg.toFixed(1)} ({count})</Text>
      </View>

      {/* Editor */}
      {!token ? (
        <TouchableOpacity onPress={() => router.push('/(auth)/LoginScreen')} style={{ backgroundColor: '#111', padding: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Đăng nhập để đánh giá</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{myComment ? 'Cập nhật đánh giá của bạn' : 'Đánh giá sản phẩm'}</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                <Ionicons name={rating >= i + 1 ? 'star' : 'star-outline'} size={22} color={'#f5a623'} style={{ marginRight: 4 }} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
            multiline
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, minHeight: 80 }}
          />
          <TouchableOpacity onPress={submit} disabled={submitting} style={{ backgroundColor: '#111', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{myComment ? 'Cập nhật' : 'Gửi đánh giá'}</Text>
          </TouchableOpacity>
          {!!myComment && (
            <TouchableOpacity onPress={removeMine} style={{ backgroundColor: '#aaa', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Xóa đánh giá</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      {loading ? (
  <ActivityIndicator />
) : items.length === 0 ? (
  <Text style={{ color: '#666' }}>Chưa có đánh giá nào</Text>
) : (
  <View>
    {items.map((item) => (
      <View key={item._id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          {typeof item.user_id === 'object' && (item.user_id as any)?.avatar_url ? (
            <Image source={{ uri: (item.user_id as any).avatar_url }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
          ) : (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ddd', marginRight: 8 }} />
          )}
          <Text style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {typeof item.user_id === 'object' ? ((item.user_id as any)?.full_name || 'Người dùng') : 'Người dùng'}
          </Text>
          {renderStars(item.rating, 14)}
        </View>
        <Text style={{ color: '#333' }}>{item.content}</Text>
      </View>
    ))}
  </View>
)}
       
    </View>
  );
}
