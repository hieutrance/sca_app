import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Car, Users, CheckCircle2, X } from 'lucide-react-native';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function RentTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [pickupTime, setPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          setIsLoading(false);
        }, (error) => {
           console.error(error);
           setIsLoading(false);
        });

      } catch (error) {
        setIsLoading(false);
      }
    };
    loadData();

    // THÊM TIMEOUT DỰ PHÒNG CHỐNG KẸT
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
       unsub();
       clearTimeout(timeout);
    };
  }, []);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleSubmitRequest = async () => {
    if (!pickupTime) return showAlert('Thiếu thông tin', 'Vui lòng nhập thời gian bạn muốn nhận xe.');
    setIsSubmitting(true);
    try {
      const requestsRef = ref(db, 'BookingRequests');
      await set(push(requestsRef), {
        customer_id: currentUser.id, customer_name: currentUser.full_name, customer_phone: currentUser.phone,
        car_id: selectedCar.id, car_model: selectedCar.car_model, pickup_time: pickupTime,
        status: 'PENDING', created_at: new Date().toISOString()
      });
      showAlert('Thành công', 'Đã gửi yêu cầu thuê xe! Vui lòng chờ Admin phê duyệt.');
      setSelectedCar(null); setPickupTime('');
    } catch (error) {
      showAlert('Lỗi', 'Có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chọn Xe Thuê</Text>
        <Text style={styles.headerSub}>Danh sách các xe đang sẵn sàng hoạt động</Text>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {availableCars.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Hiện tại không có xe nào đang rảnh.</Text>
          </View>
        ) : (
          availableCars.map((car) => (
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
          ))
        )}
      </ScrollView>

      {selectedCar && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu cầu Thuê Xe</Text>
              <TouchableOpacity onPress={() => setSelectedCar(null)} style={styles.closeBtn}><X color="#9ca3af" size={24} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalCarName}>{selectedCar.car_model}</Text>
              <Text style={styles.modalCarPlate}>Biển số: {selectedCar.license_plate}</Text>
              <Text style={styles.label}>Thời gian dự kiến nhận xe:</Text>
              <TextInput style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} placeholder="VD: 14:00 hôm nay..." placeholderTextColor="#64748b" value={pickupTime} onChangeText={setPickupTime} />
              <TouchableOpacity style={styles.submitBtn} disabled={isSubmitting} onPress={handleSubmitRequest}>
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Gửi Yêu Cầu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  loadingContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  headerSub: { color: '#94a3b8', fontSize: 14 },
  listContainer: { flex: 1, paddingHorizontal: 24 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  carCard: { backgroundColor: '#334155', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  carImagePlaceholder: { width: 70, height: 70, backgroundColor: '#1e293b', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  carInfo: { flex: 1 },
  carModel: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  carPlate: { color: '#9ca3af', fontSize: 13, fontFamily: 'monospace', marginBottom: 12 },
  carTags: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#475569', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  tagText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  modalBody: {},
  modalCarName: { color: '#3b82f6', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  modalCarPlate: { color: '#94a3b8', fontSize: 14, marginBottom: 24 },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, color: '#ffffff', fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});