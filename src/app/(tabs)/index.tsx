import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Platform, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Bluetooth, Key, Car as CarIcon, Volume2, Unlock, Lock, Archive, User, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react-native';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../services/firebase'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function HomeTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [carData, setCarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('customerData');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        } else {
          router.replace('/login');
        }
      } catch (error) {
        router.replace('/login');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const bookingsRef = ref(db, 'Bookings');
    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allBookings = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const myBooking = allBookings.find(b => 
          b.customer_id === currentUser.id && 
          (b.status === 'ACTIVE' || b.status === 'OVERDUE')
        );
        
        setActiveBooking(myBooking || null);

        if (myBooking) {
          const carRef = ref(db, `Vehicles/${myBooking.car_id}`);
          onValue(carRef, (carSnap) => {
            setCarData(carSnap.val());
            setIsLoading(false);
          });
        } else {
          setCarData(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }, (error) => {
      console.error(error);
      setIsLoading(false);
    });

    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      unsubBookings();
      clearTimeout(timeout);
    };
  }, [currentUser]);

  const handleManualUnlock = async () => {
    if (!activeBooking) return;
    try {
      await update(ref(db, `Vehicles/${activeBooking.car_id}`), { door_status: 'Unlocked' });
      if (Platform.OS === 'web') window.alert("Đã gửi lệnh: MỞ KHÓA THỦ CÔNG");
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualLock = async () => {
    if (!activeBooking) return;
    try {
      await update(ref(db, `Vehicles/${activeBooking.car_id}`), { door_status: 'Locked' });
      if (Platform.OS === 'web') window.alert("Đã gửi lệnh: KHÓA CỬA XE");
    } catch (err) {
      console.error(err);
    }
  };

  const handleFindCar = () => {
    if (Platform.OS === 'web') window.alert("Đang kích hoạt còi và đèn nhấp nháy định vị xe trong bãi...");
  };

  const handleOpenTrunk = () => {
    if (Platform.OS === 'web') window.alert("Đã gửi lệnh: MỞ CỐP SAU");
  };

  if (isLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!activeBooking) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyIconBox}>
          <Key color="#9ca3af" size={40} />
        </View>
        <Text style={styles.emptyTitle}>Không có khóa</Text>
        <Text style={styles.emptyText}>Bạn hiện chưa có chuyến đi nào được cấp phát.{"\n"}Vui lòng vào tab Đặt Xe để yêu cầu.</Text>
      </SafeAreaView>
    );
  }

  const isBleConnected = carData?.ble_connected === true;
  const currentDistance = carData?.uwb_distance || '> 50m';
  const connectionColor = isBleConnected ? '#10b981' : '#ef4444'; 
  const connectionBg = isBleConnected ? '#10b98120' : '#ef444420';
  const isOverdue = activeBooking?.status === 'OVERDUE';
  const isCarOnline = carData?.network_status === 'ONLINE';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          
          {/* Header Thông tin Xe */}
          <View style={styles.header}>
            <View style={styles.carModelContainer}>
              <Text style={styles.carModel}>{carData?.car_model || 'Xe của bạn'}</Text>
              
              <View style={[styles.networkBadge, isCarOnline ? styles.networkOnline : styles.networkOffline]}>
                {isCarOnline ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#94a3b8" />}
                <Text style={[styles.networkText, isCarOnline ? { color: '#10b981' } : { color: '#94a3b8' }]}>
                  {isCarOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                </Text>
              </View>
            </View>
            
            <View style={styles.licensePlateBox}>
              <Text style={styles.licensePlateText}>{carData?.license_plate || '---'}</Text>
            </View>

            {activeBooking?.expire_time && (
              <View style={[styles.rentalTimeBadge, isOverdue ? styles.rentalTimeOverdue : styles.rentalTimeActive]}>
                {isOverdue ? (
                  <AlertTriangle size={13} color="#f87171" style={{ marginRight: 6 }} />
                ) : (
                  <Clock size={13} color="#38bdf8" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.rentalTimeLabel}>
                  {isOverdue ? 'Quá hạn từ: ' : 'Hạn trả xe: '}
                </Text>
                <Text style={[styles.rentalTimeValue, isOverdue && { color: '#f87171' }]}>
                  {activeBooking.expire_time}
                </Text>
              </View>
            )}
          </View>

          {/* Hình ảnh xe dùng flex: 1 để tự động đẩy các UI xuống */}
          <View style={styles.carImageContainer}>
            <CarIcon color="#f1f5f9" size={120} strokeWidth={1.5} />
            <View style={[styles.statusBadge, { backgroundColor: carData?.door_status === 'Unlocked' ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.statusText}>{carData?.door_status === 'Unlocked' ? 'ĐANG MỞ CỬA' : 'ĐANG KHÓA'}</Text>
            </View>
          </View>

          {/* Control Panel 4 nút */}
          <View style={styles.controlPanel}>
            <View style={styles.radarCard}>
              <Text style={styles.radarTitle}>Trạng thái định vị khoảng cách</Text>
              <View style={styles.radarVisualizer}>
                <View style={[styles.nodeCircle, { borderColor: connectionColor, backgroundColor: connectionBg }]}>
                  <User color={connectionColor} size={20} />
                </View>
                <View style={styles.lineWrapper}>
                  <View style={[styles.dashedLine, { borderColor: connectionColor, opacity: isBleConnected ? 0.8 : 0.4 }]} />
                  <View style={[styles.distancePill, { backgroundColor: connectionColor }]}>
                    {isBleConnected && <View style={styles.iconWrapperSmall}><Bluetooth color="#ffffff" size={13} /></View>}
                    <Text style={styles.distancePillText}>{isBleConnected ? currentDistance : 'Mất kết nối'}</Text>
                  </View>
                </View>
                <View style={[styles.nodeCircle, { borderColor: connectionColor, backgroundColor: connectionBg }]}>
                  <CarIcon color={connectionColor} size={22} />
                </View>
              </View>
            </View>

            <View style={styles.buttonGrid}>
              <View style={styles.row}>
                <TouchableOpacity onPress={handleManualUnlock} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
                  <View style={styles.iconWrapper}><Unlock color="#38bdf8" size={22} /></View>
                  <Text style={styles.actionText}>Mở khóa thủ công</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleManualLock} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
                  <View style={styles.iconWrapper}><Lock color="#f87171" size={22} /></View>
                  <Text style={styles.actionText}>Khóa cửa xe</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity onPress={handleFindCar} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
                  <View style={styles.iconWrapper}><Volume2 color="#fbbf24" size={22} /></View>
                  <Text style={styles.actionText}>Tìm xe trong bãi</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenTrunk} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
                  <View style={styles.iconWrapper}><Archive color="#a78bfa" size={22} /></View>
                  <Text style={styles.actionText}>Mở cốp sau</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  scrollContent: { flexGrow: 1 },
  contentWrapper: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'space-between' },
  
  loadingContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconBox: { width: 80, height: 80, backgroundColor: '#334155', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  
  header: { alignItems: 'center', marginBottom: 12, marginTop: 4 },
  carModelContainer: { flexDirection: 'column', alignItems: 'center', marginBottom: 10 },
  carModel: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  
  networkBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  networkOnline: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  networkOffline: { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: 'rgba(148, 163, 184, 0.2)' },
  networkText: { fontSize: 11, fontWeight: 'bold' },

  licensePlateBox: { borderWidth: 1, borderColor: '#334155', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  licensePlateText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  rentalTimeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  rentalTimeActive: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.25)' },
  rentalTimeOverdue: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)' },
  rentalTimeLabel: { color: '#94a3b8', fontSize: 12 },
  rentalTimeValue: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },

  // Chuyển margin cứng thành flex để co giãn thông minh
  carImageContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 140, marginVertical: 16 },
  statusBadge: { marginTop: -4, paddingHorizontal: 18, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  
  controlPanel: { gap: 12 },
  radarCard: { backgroundColor: '#334155', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#475569' },
  radarTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  radarVisualizer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nodeCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  lineWrapper: { flex: 1, height: 36, position: 'relative', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  dashedLine: { position: 'absolute', left: 0, right: 0, borderBottomWidth: 2, borderStyle: 'dashed' },
  distancePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  distancePillText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  iconWrapperSmall: { marginRight: 4 },
  
  buttonGrid: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  card: { flex: 1, minHeight: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8 },
  actionCard: { backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
  iconWrapper: { marginBottom: 4 },
  actionText: { color: '#f1f5f9', fontWeight: '600', fontSize: 12, textAlign: 'center' }
});