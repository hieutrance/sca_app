import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity } from 'react-native';
import { Car, Calendar, Clock, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react-native';

interface HistoryItem {
  id: string;
  car_model: string;
  license_plate: string;
  seats: string;
  start_time: string;
  end_time: string;
  total_cost: string;
  status: 'COMPLETED';
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'BK_90821',
    car_model: 'MAZDA CX-5',
    license_plate: '59H - 33859',
    seats: '5 chỗ',
    start_time: '22/07/2026 08:00',
    end_time: '23/07/2026 08:00',
    total_cost: '850.000 đ',
    status: 'COMPLETED'
  },
  {
    id: 'BK_84712',
    car_model: 'Vinfast VF8',
    license_plate: '51H - 46789',
    seats: '5 chỗ',
    start_time: '15/07/2026 09:30',
    end_time: '17/07/2026 09:30',
    total_cost: '2.100.000 đ',
    status: 'COMPLETED'
  },
  {
    id: 'BK_73190',
    car_model: 'Toyota Camry 2.0Q',
    license_plate: '59H - 95512',
    seats: '5 chỗ',
    start_time: '02/07/2026 14:00',
    end_time: '03/07/2026 14:00',
    total_cost: '950.000 đ',
    status: 'COMPLETED'
  }
];

export default function HistoryTab() {
  const [historyList] = useState<HistoryItem[]>(MOCK_HISTORY);

  const renderHistoryCard = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      {/* Hàng trên: Thông tin xe & Huy hiệu hoàn tất */}
      <View style={styles.cardHeader}>
        <View style={styles.carIdentity}>
          <View style={styles.carIconBox}>
            <Car color="#38bdf8" size={22} />
          </View>
          <View>
            <Text style={styles.carModel}>{item.car_model}</Text>
            <Text style={styles.carPlate}>{item.license_plate} • {item.seats}</Text>
          </View>
        </View>
        <View style={styles.badgeCompleted}>
          <CheckCircle2 color="#10b981" size={12} />
          <Text style={styles.badgeText}>ĐÃ HOÀN TẤT</Text>
        </View>
      </View>

      {/* Đường phân cách */}
      <View style={styles.divider} />

      {/* Hàng giữa: Thời gian thuê */}
      <View style={styles.timeSection}>
        <View style={styles.timeRow}>
          <Calendar color="#94a3b8" size={14} />
          <Text style={styles.timeLabel}>Bắt đầu:</Text>
          <Text style={styles.timeValue}>{item.start_time}</Text>
        </View>
        <View style={styles.timeRow}>
          <Clock color="#94a3b8" size={14} />
          <Text style={styles.timeLabel}>Kết thúc:</Text>
          <Text style={styles.timeValue}>{item.end_time}</Text>
        </View>
      </View>

      {/* Hàng dưới: Mã booking & Chi phí */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.bookingIdLabel}>MÃ CHUYẾN ĐI</Text>
          <Text style={styles.bookingId}>{item.id}</Text>
        </View>
        <View style={styles.costBox}>
          <Text style={styles.costLabel}>TỔNG TIỀN</Text>
          <Text style={styles.costValue}>{item.total_cost}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        
        {/* Tiêu đề trang */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch Sử Thuê Xe</Text>
          <Text style={styles.headerSubtitle}>Danh sách các chuyến đi đã kết thúc và thanh toán an toàn.</Text>
        </View>

        {/* Danh sách cuộn */}
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  header: { marginBottom: 20, paddingTop: 16 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#94a3b8' },
  listContainer: { paddingBottom: 30, gap: 16 },
  card: { backgroundColor: '#334155', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#475569' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  carModel: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  carPlate: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
  badgeCompleted: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  badgeText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#475569', marginVertical: 14, opacity: 0.6 },
  timeSection: { gap: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeLabel: { fontSize: 12, color: '#94a3b8' },
  timeValue: { fontSize: 12, color: '#e2e8f0', fontWeight: '500' },
  cardFooter: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#475569', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bookingIdLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 },
  bookingId: { fontSize: 13, color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace', marginTop: 2 },
  costBox: { alignItems: 'flex-end' },
  costLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 },
  costValue: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginTop: 2 }
});