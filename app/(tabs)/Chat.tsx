// app/(tabs)/Chat.tsx
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Msg = { id: string; from: 'bot' | 'user'; text: string };

// Các câu hỏi mẫu – chỉnh sửa ở đây
const QUICK = [
  'Phí ship bao nhiêu?',
  'Giao hàng bao lâu?',
  'Giờ mở cửa?',
  'Chính sách đổi trả?',
  'Tư vấn size',
  'Theo dõi đơn hàng',
  'Liên hệ',
];


function replyFor(raw: string): string {
  const text = raw.toLowerCase();
  if (/(^|\s)(chào|xin chào|hi|hello)\b/.test(text))
    return 'Chào bạn 👋 Mình hỗ trợ: phí ship, giao hàng, giờ mở cửa, đổi trả, tư vấn size…';
  if (text.includes('phí ship') || text.includes('vận chuyển') || text.includes('ship bao nhiêu'))
    return 'Phí ship nội thành 20–30k, ngoại tỉnh 30–40k. Đơn từ 499k **free ship**.';
  if (text.includes('bao lâu') || text.includes('khi nào') || text.includes('giao hàng'))
    return 'Giao nội thành 1–2 ngày, ngoại tỉnh 2–4 ngày. Có COD toàn quốc.';
  if (text.includes('giờ mở') || text.includes('mở cửa') || text.includes('giờ làm việc'))
    return 'Giờ hoạt động **08:00–22:00** mỗi ngày.';
  if (text.includes('đổi') || text.includes('trả') || text.includes('đổi trả') || text.includes('return'))
    return 'Đổi size/mẫu trong **7 ngày**, hàng còn tag, chưa sử dụng. Đổi tại shop hoặc gửi chuyển phát.';
  if (text.includes('size') || text.includes('kích cỡ'))
    return 'Bạn cho mình chiều cao/cân nặng (vd 1m70/65kg) để tư vấn size chuẩn nhé.';
  if (text.includes('đơn hàng') || text.includes('mã đơn') || text.includes('theo dõi'))
    return 'Bạn gửi giúp mình **mã đơn** (vd MZ123456) để mình kiểm tra tình trạng đơn.';
  if (text.includes('liên hệ') || text.includes('hotline') || text.includes('sđt'))
    return 'Hotline/Zalo: 038 440 2256 – hỗ trợ 08:00–22:00 mỗi ngày.';
  return 'Mình chưa hiểu ý 🥺. Chọn 1 câu bên dưới nhé.';
}

export default function Chat() {
  const tabBarH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const BOTTOM_OFFSET = Math.max(tabBarH, insets.bottom) + 6; // đội panel lên khỏi TabBar

 
  const PANEL_MAX_H = 180; 
  const BOTTOM_STACK_H = PANEL_MAX_H + 10; 

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      from: 'bot',
      text: 'Chào bạn 👋 Mình là trợ lý cửa hàng. Chọn câu hỏi bên dưới nha.',
    },
  ]);
  const listRef = useRef<FlatList<Msg>>(null);

  const sendQuick = (q: string) => {
    const userMsg: Msg = { id: Date.now() + '', from: 'user', text: q };
    setMessages((m) => [...m, userMsg]);
    setTimeout(() => {
      const botMsg: Msg = { id: Date.now() + '_b', from: 'bot', text: replyFor(q) };
      setMessages((m) => [...m, botMsg]);
      listRef.current?.scrollToEnd({ animated: true });
    }, 250);
  };

  const renderItem = ({ item }: { item: Msg }) => (
    <View style={[styles.bubble, item.from === 'user' ? styles.me : styles.bot]}>
      <Text style={{ color: item.from === 'user' ? '#fff' : '#000' }}>{item.text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffd6d2' }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 1, paddingBottom: 20 }]}>
        <Text style={styles.headerTitle}>Trợ lý cửa hàng</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: BOTTOM_OFFSET + BOTTOM_STACK_H, // chừa chỗ cho panel dọc + tabbar
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.bottom, { bottom: BOTTOM_OFFSET }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: PANEL_MAX_H }}
          contentContainerStyle={styles.listCol}
        >
          {QUICK.map((q) => (
            <TouchableOpacity key={q} style={styles.rowBtn} onPress={() => sendQuick(q)}>
              <Text style={styles.rowText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const W = Dimensions.get('window').width;
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f66060ff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  bubble: { maxWidth: W * 0.7, marginVertical: 6, padding: 10, borderRadius: 12 },
  me: { alignSelf: 'flex-end', backgroundColor: '#f66060ff', borderTopRightRadius: 4 },
  bot: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffd6d2',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  listCol: { paddingBottom: 4, gap: 8 },
  rowBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowText: { fontSize: 14, color: '#000' },
});
