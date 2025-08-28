import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PoliciesScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header title="Chính sách" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="1. Điều khoản sử dụng">
          Khi truy cập và mua sắm trên ứng dụng ManzonePoly, bạn đồng ý tuân thủ
          các điều khoản: không giả mạo thông tin, không làm gián đoạn hệ thống,
          và thực hiện giao dịch trung thực. Chúng tôi có quyền tạm khóa tài
          khoản khi phát hiện hành vi bất thường hoặc vi phạm.
        </Section>

        <Section title="2. Quyền riêng tư & bảo mật">
          ManzonePoly thu thập dữ liệu tối thiểu cần thiết cho mục đích giao
          dịch: họ tên, số điện thoại, địa chỉ, lịch sử đơn hàng. Dữ liệu được
          lưu trữ an toàn và chỉ dùng để (a) giao hàng, (b) chăm sóc khách hàng,
          (c) cải thiện sản phẩm/dịch vụ. Bạn có thể yêu cầu xem/sửa/xóa thông
          tin theo quy định.
        </Section>

        <Section title="3. Tài khoản & mật khẩu">
          Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập. Nếu phát hiện
          truy cập trái phép, vui lòng liên hệ CSKH để được hỗ trợ xử lý ngay
          lập tức.
        </Section>

        <Section title="4. Giá & khuyến mãi">
          Giá có thể thay đổi tùy thời điểm; chương trình giảm giá/flash sale có
          điều kiện đi kèm và số lượng giới hạn. ManzonePoly nỗ lực hiển thị
          minh bạch để bạn dễ đối chiếu trước khi đặt hàng.
        </Section>

        <Section title="5. Bản quyền">
          Tất cả nội dung (hình ảnh, mô tả, tên gọi, mã thiết kế) thuộc sở hữu
          ManzonePoly hoặc đối tác cấp phép. Nghiêm cấm sao chép, khai thác trái
          phép cho mục đích thương mại nếu chưa được đồng ý bằng văn bản.
        </Section>

        <Section title="6. Giải quyết tranh chấp">
          Mọi bất đồng phát sinh được ưu tiên giải quyết qua thương lượng. Nếu
          không đạt thỏa thuận, tranh chấp sẽ được xử lý theo pháp luật Việt Nam
          tại cơ quan có thẩm quyền.
        </Section>

        <Text style={styles.note}>
          *Nội dung ở đây mang tính khung tham khảo. Hãy cập nhật phiên bản
          chính thức trước khi công bố.
        </Text>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.h2}>{title}</Text>
      <Text style={styles.p}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#ff4d4f",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  content: { padding: 16, paddingBottom: 32 },
  h2: { fontSize: 15, fontWeight: "bold", color: "#0039e6", marginBottom: 8 },
  p: { fontSize: 14, color: "#333", lineHeight: 20 },
  note: { fontSize: 13, color: "#777", fontStyle: "italic", marginTop: 8 },
});
