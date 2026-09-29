import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, SafeAreaView } from 'react-native';
import { Car, Users, CheckCircle2, X, AlertCircle, ArrowRight, ShieldCheck, Key, Clock, CreditCard } from 'lucide-react-native';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function RentTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái vòng đời
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  
  // State Modal đặt xe
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const HOURLY_RATE = 80000; // 80k/giờ
  
  const generateDates = (daysCount: number) => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const generateTimes = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      times.push(`${hour}:00`);
      times.push(`${hour}:30`);
    }
    return times;
  };

  const [dateOptions] = useState<Date[]>(generateDates(30)); // Render 30 ngày tới
  const [timeOptions] = useState<string[]>(generateTimes());

  const [pickupDate, setPickupDate] = useState<Date>(dateOptions[0]);
  const [pickupTime, setPickupTime] = useState<string>('07:00');
  
  const [returnDate, setReturnDate] = useState<Date>(dateOptions[1]);
  const [returnTime, setReturnTime] = useState<string>('20:00');

  // --- LẮNG NGHE DỮ LIỆU ---
  useEffect(() => {
    let unsub = () => {};
    const loadData = async () => {
      try {
        const userData = await AsyncStorage.getItem('customerData');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        } else {
          router.replace('/login');
          return;
        }

        const vehiclesRef = ref(db, 'Vehicles');
        unsub = onValue(vehiclesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const cars = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(car => car.status === 'AVAILABLE');
            setAvailableCars(cars);
          } else {
            setAvailableCars([]);
          }
        });

        // Tương tự cho Requests & Bookings...
        const requestsRef = ref(db, 'BookingRequests');
        onValue(requestsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const myRequests = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(r => r.customer_id === JSON.parse(userData).id && r.status === 'PENDING');
            setPendingRequest(myRequests.length > 0 ? myRequests[myRequests.length - 1] : null);
          } else setPendingRequest(null);
        });

        const bookingsRef = ref(db, 'Bookings');
        onValue(bookingsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const myBookings = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(b => b.customer_id === JSON.parse(userData).id && (b.status === 'ACTIVE' || b.status === 'OVERDUE'));
            setActiveBooking(myBookings.length > 0 ? myBookings[0] : null);
          } else setActiveBooking(null);
          setIsLoading(false);
        });
      } catch {
        setIsLoading(false);
      }
    };
    loadData();
    const timeout = setTimeout(() => setIsLoading(false), 5000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  // --- TÍNH TOÁN THỜI GIAN & CHI PHÍ ---
  const calculateBookingDetails = () => {
    const pDate = new Date(pickupDate);
    const [ph, pm] = pickupTime.split(':').map(Number);
    pDate.setHours(ph, pm, 0, 0);

    const rDate = new Date(returnDate);
    const [rh, rm] = returnTime.split(':').map(Number);
    rDate.setHours(rh, rm, 0, 0);

    const diffMs = rDate.getTime() - pDate.getTime();
    if (diffMs <= 0) return { hours: 0, cost: 0, isValid: false };

    const hours = diffMs / (1000 * 60 * 60);
    const cost = hours * HOURLY_RATE;
    return { hours, cost, isValid: true, pDate, rDate };
  };

  const { hours, cost, isValid, pDate, rDate } = calculateBookingDetails();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const getDayName = (d: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[d.getDay()];
  };

  const formatToDB = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const handleSubmitRequest = async () => {
    if (!isValid) {
      const msg = 'Thời gian trả xe phải lớn hơn thời gian nhận xe.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Lỗi logic', msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const requestsRef = ref(db, 'BookingRequests');
      await set(push(requestsRef), {
        customer_id: currentUser.id,
        customer_name: currentUser.full_name || currentUser.id,
        customer_phone: currentUser.phone || '',
        car_id: selectedCar.id,
        car_model: selectedCar.car_model,
        license_plate: selectedCar.license_plate,
        pickup_time: formatToDB(pDate!),
        return_time: formatToDB(rDate!),
        estimated_hours: hours,
        estimated_cost: cost,
        status: 'PENDING',
        created_at: new Date().toISOString()
      });
      setSelectedCar(null);
    } catch {
      if (Platform.OS === 'web') window.alert('Lỗi gửi yêu cầu!');
      else Alert.alert('Lỗi', 'Không thể gửi yêu cầu đặt xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    if (Platform.OS === 'web' && !window.confirm("Hủy yêu cầu thuê xe này?")) return;
    try {
      await remove(ref(db, `BookingRequests/${pendingRequest.id}`));
    } catch {
      if (Platform.OS === 'web') window.alert('Lỗi khi hủy yêu cầu!');
    }
  };

  if (isLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (activeBooking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trạng Thái Thuê Xe</Text>
          <Text style={styles.headerSub}>Phiên thuê hiện tại đang có hiệu lực</Text>
        </View>
        <View style={styles.statusScreenWrapper}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <ShieldCheck size={28} color="#10b981" />
              </View>
              <View style={styles.approvedBadge}>
                <CheckCircle2 size={12} color="#10b981" />
                <Text style={styles.approvedBadgeText}>ĐÃ PHÊ DUYỆT</Text>
              </View>
            </View>
            <Text style={styles.statusCarModel}>Xe: {activeBooking.car_id}</Text>
            <Text style={styles.statusNotice}>Chìa khóa số (Digital Key) đã sẵn sàng hoạt động trên thiết bị của bạn.</Text>
            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Clock size={15} color="#94a3b8" />
                <Text style={styles.detailLabel}>Hạn sử dụng khóa:</Text>
                <Text style={styles.detailValue}>{activeBooking.expire_time}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.8} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.primaryActionBtnText}>Đến Màn Hình Điều Khiển</Text>
              <ArrowRight size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (pendingRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu Cầu Của Bạn</Text>
          <Text style={styles.headerSub}>Thông tin đăng ký xe đang được xét duyệt</Text>
        </View>
        <View style={styles.statusScreenWrapper}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Clock size={28} color="#f59e0b" />
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>CHỜ DUYỆT</Text>
              </View>
            </View>
            <Text style={styles.statusCarModel}>{pendingRequest.car_model}</Text>
            <Text style={styles.statusCarPlate}>Mã xe: {pendingRequest.car_id}</Text>
            <Text style={styles.statusNotice}>Yêu cầu của bạn đã được gửi tới Quản trị viên.</Text>
            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian nhận:</Text>
                <Text style={styles.detailValue}>{pendingRequest.pickup_time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian trả xe:</Text>
                <Text style={[styles.detailValue, { color: '#38bdf8' }]}>{pendingRequest.return_time}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleCancelRequest}>
              <Text style={styles.cancelBtnText}>Hủy Yêu Cầu Thuê Xe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- GIAO DIỆN CHỌN XE 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chọn Xe Thuê</Text>
        <Text style={styles.headerSub}>Danh sách các xe đang sẵn sàng hoạt động</Text>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {availableCars.map((car) => (
          <TouchableOpacity key={car.id} style={styles.carCard} activeOpacity={0.8} onPress={() => setSelectedCar(car)}>
            <View style={styles.carImagePlaceholder}><Car color="#94a3b8" size={36} /></View>
            <View style={styles.carInfo}>
              <Text style={styles.carModel}>{car.car_model || 'Xe chưa rõ tên'}</Text>
              <Text style={styles.carPlate}>{car.license_plate}</Text>
              <View style={styles.carTags}>
                <View style={styles.tag}><Users color="#cbd5e1" size={14} /><Text style={styles.tagText}>{car.seats || '5'} chỗ</Text></View>
                <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}><CheckCircle2 color="#10b981" size={14} /><Text style={[styles.tagText, { color: '#10b981' }]}>Sẵn sàng</Text></View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* TÙY CHỈNH MODAL THỜI GIAN THEO DẠNG DẢI TRƯỢT NGANG */}
      <Modal visible={!!selectedCar} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.sliderModalContent}>
            
            <View style={styles.miotoHeader}>
              <View style={{ width: 32 }} />
              <Text style={styles.miotoTitle}>Thiết lập thời gian</Text>
              <TouchableOpacity style={styles.closeIconBtn} onPress={() => setSelectedCar(null)}>
                <X color="#0f172a" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBodyScroll}>
              
              {/* PHẦN 1: NHẬN XE */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>1. CHỌN LỊCH NHẬN XE</Text>
                
                {/* Trượt chọn Ngày Nhận */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sliderWrap} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {dateOptions.map((date, idx) => {
                    const isSelected = pickupDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity key={idx} style={[styles.sliderItem, isSelected && styles.sliderItemActive]} onPress={() => setPickupDate(date)}>
                        <Text style={[styles.sliderItemDay, isSelected && styles.sliderTextActive]}>{getDayName(date)}</Text>
                        <Text style={[styles.sliderItemDate, isSelected && styles.sliderTextActive]}>{date.getDate()}/{date.getMonth() + 1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Trượt chọn Giờ Nhận */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sliderWrap} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {timeOptions.map((time, idx) => {
                    const isSelected = pickupTime === time;
                    return (
                      <TouchableOpacity key={idx} style={[styles.sliderTimeItem, isSelected && styles.sliderItemActive]} onPress={() => setPickupTime(time)}>
                        <Text style={[styles.sliderTimeText, isSelected && styles.sliderTextActive]}>{time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* PHẦN 2: TRẢ XE */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>2. CHỌN LỊCH TRẢ XE</Text>
                
                {/* Trượt chọn Ngày Trả */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sliderWrap} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {dateOptions.map((date, idx) => {
                    const isSelected = returnDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity key={idx} style={[styles.sliderItem, isSelected && styles.sliderItemActive]} onPress={() => setReturnDate(date)}>
                        <Text style={[styles.sliderItemDay, isSelected && styles.sliderTextActive]}>{getDayName(date)}</Text>
                        <Text style={[styles.sliderItemDate, isSelected && styles.sliderTextActive]}>{date.getDate()}/{date.getMonth() + 1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Trượt chọn Giờ Trả */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sliderWrap} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {timeOptions.map((time, idx) => {
                    const isSelected = returnTime === time;
                    return (
                      <TouchableOpacity key={idx} style={[styles.sliderTimeItem, isSelected && styles.sliderItemActive]} onPress={() => setReturnTime(time)}>
                        <Text style={[styles.sliderTimeText, isSelected && styles.sliderTextActive]}>{time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* HIỂN THỊ CẢNH BÁO LỖI NẾU CHỌN NGƯỢC THỜI GIAN */}
              {!isValid && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.errorText}>Thời gian trả xe phải diễn ra sau thời gian nhận xe.</Text>
                </View>
              )}

            </ScrollView>

            {/* BẢNG TÓM TẮT & NÚT SUBMIT */}
            <View style={styles.miotoFooter}>
              <View style={styles.costBox}>
                <Text style={styles.costLabel}>Thời gian thuê: <Text style={styles.boldBlack}>{isValid ? hours : 0} giờ</Text></Text>
                <Text style={styles.costValue}>{isValid ? formatCurrency(cost) : '0 đ'}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.continueBtn, !isValid && { backgroundColor: '#cbd5e1' }]} 
                onPress={handleSubmitRequest} 
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Yêu cầu đặt xe</Text>}
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // CSS NỀN ĐEN GỐC APP
  container: { flex: 1, backgroundColor: '#1e293b' },
  loadingContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  headerSub: { color: '#94a3b8', fontSize: 13 },
  listContainer: { flex: 1, paddingHorizontal: 24 },
  emptyBox: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
  carCard: { backgroundColor: '#334155', borderRadius: 20, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  carImagePlaceholder: { width: 64, height: 64, backgroundColor: '#1e293b', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  carInfo: { flex: 1 },
  carModel: { color: '#ffffff', fontSize: 17, fontWeight: 'bold', marginBottom: 3 },
  carPlate: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', marginBottom: 10 },
  carTags: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#475569', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, gap: 4 },
  tagText: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },

  // Giao diện Thẻ Trạng Thái (PENDING & ACTIVE)
  statusScreenWrapper: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  statusCard: { backgroundColor: '#334155', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#475569' },
  statusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pendingBadgeText: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  approvedBadgeText: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  statusCarModel: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statusCarPlate: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', marginBottom: 14 },
  statusNotice: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  detailBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#94a3b8', fontSize: 13 },
  detailValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  primaryActionBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryActionBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  cancelBtnText: { color: '#f87171', fontSize: 14, fontWeight: '600' },

  // GIAO DIỆN MODAL TRƯỢT MỚI (NỀN TRẮNG)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sliderModalContent: { backgroundColor: '#f8fafc', height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  miotoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  miotoTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  closeIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  
  modalBodyScroll: { paddingVertical: 16 },
  sectionBlock: { backgroundColor: '#ffffff', paddingVertical: 16, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', marginLeft: 16, marginBottom: 12, letterSpacing: 0.5 },
  
  sliderWrap: { marginBottom: 12 },
  sliderItem: { width: 64, height: 70, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  sliderItemActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  sliderItemDay: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  sliderItemDate: { fontSize: 15, color: '#0f172a', fontWeight: 'bold' },
  
  sliderTimeItem: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  sliderTimeText: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
  
  sliderTextActive: { color: '#ffffff' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },

  miotoFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  costBox: { flex: 1 },
  costLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  boldBlack: { color: '#0f172a', fontWeight: 'bold' },
  costValue: { fontSize: 20, fontWeight: '900', color: '#10b981' },
  
  continueBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, minWidth: 130, alignItems: 'center' },
  continueBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});