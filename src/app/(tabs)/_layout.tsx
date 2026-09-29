import { Tabs } from 'expo-router';
import { Car, Clock, User, Calendar, MessageCircle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: '#3b82f6', 
        tabBarInactiveTintColor: '#64748b', 
        tabBarStyle: {
          backgroundColor: '#0f172a', 
          borderTopWidth: 1,
          borderTopColor: '#1e293b', 
          height: 75, 
          paddingBottom: 10, 
          paddingTop: 7,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Điều Khiển',
          tabBarIcon: ({ color }) => <Car color={color} size={24} />,
        }}
      />
      {/* THÊM TAB ĐẶT XE MỚI VÀO ĐÂY */}
      <Tabs.Screen
        name="rent"
        options={{
          title: 'Đặt Xe',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Hỗ Trợ',
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch Sử',
          tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài Khoản',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}