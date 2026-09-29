import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { Send, User, Car } from 'lucide-react-native';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ChatTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // 1. Tải thông tin User
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
        console.error(error);
      }
    };
    loadUser();
  }, []);

  // Lắng nghe từ Firebase
  useEffect(() => {
    if (!currentUser) return;

    const chatRef = ref(db, `Chats/${currentUser.id}/messages`);
    const unsub = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sắp xếp theo thời gian cũ -> mới
        msgList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(msgList);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
      // Tự động cuộn xuống cuối khi có tin nhắn mới
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    });

    return () => unsub();
  }, [currentUser]);

  // Hàm Gửi tin nhắn
  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;

    const newMessage = {
      text: inputText.trim(),
      sender: 'user', 
      timestamp: new Date().toISOString(),
    };

    try {
      setInputText(''); 
      
      const roomMetaRef = ref(db, `Chats/${currentUser.id}/meta`);
      await set(roomMetaRef, {
        customer_name: currentUser.full_name || currentUser.id,
        customer_phone: currentUser.phone || '',
        last_message: newMessage.text,
        last_update: newMessage.timestamp,
        unread_admin: true 
      });

      const newMsgRef = push(ref(db, `Chats/${currentUser.id}/messages`));
      await set(newMsgRef, newMessage);

    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  // Render từng dòng tin nhắn
  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === 'user';
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={styles.avatarOther}>
            <Car color="#2563eb" size={16} />
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trung tâm Hỗ trợ</Text>
          <Text style={styles.headerSubtitle}>● Admin đang online</Text>
        </View>
        <View style={styles.headerIcon}>
          <User color="#3b82f6" size={20} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardAvoid}
      >
        {/* Vùng hiển thị tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Hãy gửi yêu cầu để được hỗ trợ!</Text>
            </View>
          }
        />

        {/* Vùng nhập tin nhắn */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9ca3af"
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
          </View>
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
          >
            <Send color="#ffffff" size={20} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 16
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#16a34a', fontWeight: '500', marginTop: 2 },
  headerIcon: { width: 40, height: 40, backgroundColor: '#eff6ff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  keyboardAvoid: { flex: 1 },
  chatContainer: { padding: 20, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: '#9ca3af', textAlign: 'center', fontSize: 16, lineHeight: 24 },
  
  messageRow: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatarOther: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 'auto' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  messageBubbleMe: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  messageTextMe: { color: '#ffffff' },
  messageTextOther: { color: '#0f172a' },
  timeText: { fontSize: 10, marginTop: 4 },
  timeTextMe: { color: '#93c5fd', textAlign: 'right' },
  timeTextOther: { color: '#64748b', textAlign: 'left' },

  inputArea: { 
    padding: 16, 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0', 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16
  },
  inputWrapper: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    minHeight: 50, 
    maxHeight: 120, 
    justifyContent: 'center', 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  input: { fontSize: 16, color: '#0f172a', paddingTop: 0, paddingBottom: 0 },
  sendButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sendButtonActive: { backgroundColor: '#2563eb' },
  sendButtonInactive: { backgroundColor: '#cbd5e1' }
});