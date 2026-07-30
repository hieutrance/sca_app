import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, User } from 'lucide-react-native';

export default function ProfileTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('customerData');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('customerData');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        
        {}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài Khoản</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User color="#9ca3af" size={40} />
          </View>
          <Text style={styles.userName}>{currentUser?.full_name || 'Khách hàng'}</Text>
          <Text style={styles.userPhone}>{currentUser?.phone || 'Chưa cập nhật SĐT'}</Text>
        </View>

        {}
        <TouchableOpacity 
          onPress={handleLogout}
          activeOpacity={0.7}
          style={styles.logoutButton}
        >
          <LogOut color="#ffffff" size={20} />
          <Text style={styles.logoutText}>Đăng xuất an toàn</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b', // Nền màu xanh đen đậm
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center', // Căn giữa nội dung
  },
  header: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#334155', // Khối nền nhạt hơn một chút
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userPhone: {
    color: '#94a3b8',
    fontSize: 16,
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444', // Nút màu đỏ
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});