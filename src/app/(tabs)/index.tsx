import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Bluetooth, MapPin, Key, Car as CarIcon, Volume2, Unlock, User } from 'lucide-react-native';
import { ref, onValue } from 'firebase/database';
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

    // KHÔI PHỤC TIMEOUT DỰ PHÒNG CHỐNG XOAY VÔ TẬN
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      unsubBookings();
      clearTimeout(timeout);
    };
  }, [currentUser]);

  const handleRemoteUnlock = () => {
    if (Platform.OS === 'web') window.alert("Tính năng Mở khóa từ xa đang được phát triển.");
  };

  const handlePingCar = () => {
    if (Platform.OS === 'web') window.alert("Đang gửi tín hiệu nháy đèn và còi đến xe...");
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
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyIconBox}>
          <Key color="#9ca3af" size={40} />
        </View>
        <Text style={styles.emptyTitle}>Không có khóa</Text>
        <Text style={styles.emptyText}>Bạn hiện chưa có chuyến đi nào được cấp phát.{"\n"}Vui lòng vào tab Đặt Xe để yêu cầu.</Text>
      </View>
    );
  }

  const isBleConnected = carData?.ble_connected === true;
  const currentDistance = carData?.uwb_distance || '> 50m';
  const connectionColor = isBleConnected ? '#10b981' : '#ef4444'; 
  const connectionBg = isBleConnected ? '#10b98120' : '#ef444420';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.contentWrapper}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.carModel}>{carData?.car_model || 'Xe của bạn'}</Text>
          <View style={styles.licensePlateBox}>
            <Text style={styles.licensePlateText}>{carData?.license_plate || '---'}</Text>
          </View>
        </View>

        {/* Hình ảnh */}
        <View style={styles.carImageContainer}>
          <CarIcon color="#f1f5f9" size={140} strokeWidth={1.5} />
          <View style={[styles.statusBadge, { backgroundColor: carData?.door_status === 'Unlocked' ? '#10b981' : '#ef4444' }]}>
            <Text style={styles.statusText}>{carData?.door_status === 'Unlocked' ? 'ĐANG MỞ CỬA' : 'ĐANG KHÓA'}</Text>
          </View>
        </View>

        {/* Điều khiển */}
        <View style={styles.controlPanel}>
          <View style={styles.radarCard}>
            <Text style={styles.radarTitle}>Trạng thái định vị khoảng cách</Text>
            <View style={styles.radarVisualizer}>
              <View style={[styles.nodeCircle, { borderColor: connectionColor, backgroundColor: connectionBg }]}>
                <User color={connectionColor} size={22} />
              </View>
              <View style={styles.lineWrapper}>
                <View style={[styles.dashedLine, { borderColor: connectionColor, opacity: isBleConnected ? 0.8 : 0.4 }]} />
                <View style={[styles.distancePill, { backgroundColor: connectionColor }]}>
                  {isBleConnected && <View style={styles.iconWrapper}><Bluetooth color="#ffffff" size={14} /></View>}
                  <Text style={styles.distancePillText}>{isBleConnected ? currentDistance : 'Mất kết nối'}</Text>
                </View>
              </View>
              <View style={[styles.nodeCircle, { borderColor: connectionColor, backgroundColor: connectionBg }]}>
                <CarIcon color={connectionColor} size={24} />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity onPress={handleRemoteUnlock} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
              <View style={styles.iconWrapper}><Unlock color="#ffffff" size={24} /></View>
              <Text style={styles.actionText}>Mở khóa từ xa</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePingCar} activeOpacity={0.7} style={[styles.card, styles.actionCard]}>
               <View style={styles.iconWrapper}><Volume2 color="#ffffff" size={24} /></View>
               <Text style={styles.actionText}>Ping Tìm Xe</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  contentWrapper: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconBox: { width: 80, height: 80, backgroundColor: '#334155', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  carModel: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginBottom: 12, letterSpacing: 0.5 },
  licensePlateBox: { borderWidth: 1, borderColor: '#334155', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  licensePlateText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  carImageContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, marginBottom: 20 },
  statusBadge: { marginTop: -10, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  statusText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  controlPanel: { marginBottom: 30, gap: 16 },
  radarCard: { backgroundColor: '#334155', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#475569' },
  radarTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  radarVisualizer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nodeCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  lineWrapper: { flex: 1, height: 40, position: 'relative', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  dashedLine: { position: 'absolute', left: 0, right: 0, borderBottomWidth: 2, borderStyle: 'dashed' },
  distancePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  distancePillText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  card: { flex: 1, minHeight: 90, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 12 },
  actionCard: { backgroundColor: '#475569', borderWidth: 1, borderColor: '#64748b' },
  iconWrapper: { marginBottom: 6 },
  actionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});