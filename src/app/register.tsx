import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Phone, Lock, User, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ref, get, set } from 'firebase/database';
import { db } from '../services/firebase';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleRegister = async () => {
    if (!fullName || !phone || !password) return showAlert('Lỗi', 'Vui lòng điền đủ!');
    if (password.length < 6) return showAlert('Lỗi', 'Mật khẩu ít nhất 6 ký tự!');
    setIsLoading(true);
    try {
      const snapshot = await get(ref(db, 'Customers'));
      const data = snapshot.val();
      if (data) {
        const allCustomers = Object.keys(data).map(key => data[key]);
        if (allCustomers.some((c:any) => c.phone === phone)) {
          showAlert('Lỗi', 'Số điện thoại đã tồn tại!');
          setIsLoading(false);
          return;
        }
      }
      const newId = 'Cust_' + Math.floor(1000 + Math.random() * 9000); 
      await set(ref(db, `Customers/${newId}`), { full_name: fullName, phone: phone, password: password, created_at: new Date().toISOString() });
      if (Platform.OS === 'web') {
        window.alert('Đăng ký thành công!');
        router.replace('/login');
      } else {
        Alert.alert('Thành công', 'Đăng ký thành công!', [{ text: 'OK', onPress: () => router.replace('/login') }]);
      }
    } catch (error) {
      showAlert('Lỗi', 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backButton}>
        <ArrowLeft color="#ffffff" size={24} />
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}><Text style={styles.title}>ĐĂNG KÝ</Text></View>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <User color="#9ca3af" size={20} />
            <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={fullName} onChangeText={setFullName} placeholder="Họ và Tên" placeholderTextColor="#9ca3af" />
          </View>
          <View style={styles.inputGroup}>
            <Phone color="#9ca3af" size={20} />
            <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={phone} onChangeText={setPhone} placeholder="Số điện thoại" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
          </View>
          <View style={styles.inputGroup}>
            <Lock color="#9ca3af" size={20} />
            <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor="#9ca3af" secureTextEntry />
          </View>
          <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.8} style={styles.submitBtn}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.submitBtnText}>TẠO TÀI KHOẢN</Text><CheckCircle2 color="#ffffff" size={20} /></>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2563eb', justifyContent: 'center' },
  backButton: { position: 'absolute', top: 48, left: 24, width: 44, height: 44, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: 2 },
  formContainer: { gap: 16 },
  // Đã gỡ bỏ Shadow
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18, marginRight: 8 }
});