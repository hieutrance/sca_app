import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Car, Phone, Lock, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title : string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!phone || !password) return showAlert('Lỗi', 'Vui lòng nhập đầy đủ!');
    setIsLoading(true);
    try {
      const snapshot = await get(ref(db, 'Customers'));
      const data = snapshot.val();
      let foundCustomer = null;
      if (data) {
        const allCustomers = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        foundCustomer = allCustomers.find(c => c.phone === phone && c.password === password);
        if (!foundCustomer) {
            const oldCustomer = allCustomers.find(c => c.phone === phone && !c.password);
            if (oldCustomer && password === '123456') foundCustomer = oldCustomer;
        }
      }
      if (foundCustomer) {
        await AsyncStorage.setItem('customerData', JSON.stringify(foundCustomer));
        router.replace('/(tabs)');
      } else showAlert('Thất bại', 'Sai số điện thoại hoặc mật khẩu!');
    } catch (error) {
      showAlert('Lỗi', 'Có lỗi kết nối máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <View style={styles.logoBox}><Car color="#2563eb" size={40} /></View>
          <Text style={styles.title}>SCA APP</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Phone color="#9ca3af" size={20} />
            <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={phone} onChangeText={setPhone} placeholder="Số điện thoại" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Lock color="#9ca3af" size={20} />
            <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor="#9ca3af" secureTextEntry />
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8} style={styles.submitBtn}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.submitBtnText}>ĐĂNG NHẬP</Text><ArrowRight color="#ffffff" size={20} /></>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.replace('/register')}><Text style={styles.footerLink}>Đăng ký ngay</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2563eb' },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  // Đã gỡ bỏ Shadow
  logoBox: { width: 80, height: 80, backgroundColor: '#ffffff', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#eff6ff' },
  title: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: 2 },
  formContainer: { gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18, marginRight: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#bfdbfe' },
  footerLink: { color: '#ffffff', fontWeight: 'bold', textDecorationLine: 'underline' }
});