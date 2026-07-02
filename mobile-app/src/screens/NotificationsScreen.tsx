import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'system' | 'promo';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Welcome to RentEase! 🚗',
    message: 'Explore top-rated vehicles or list your own car to start earning today.',
    time: 'Just now',
    type: 'system',
    read: false,
  },
  {
    id: '2',
    title: 'Instant Booking Available',
    message: 'Look for the green available tag to book cars instantly near your location.',
    time: '2 hours ago',
    type: 'promo',
    read: false,
  },
  {
    id: '3',
    title: 'Listing Tip 💡',
    message: 'Add clear, well-lit photos of your car to get up to 3x more bookings.',
    time: '1 day ago',
    type: 'system',
    read: true,
  },
];

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(notifications.map(item => ({ ...item, read: true })));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar', color: '#2563eb', bg: '#dbeafe' };
      case 'promo':
        return { name: 'pricetag', color: '#16a34a', bg: '#dcfce7' };
      default:
        return { name: 'information-circle', color: '#f59e0b', bg: '#fef3c7' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.readAllText}>Read All</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const iconInfo = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.unreadCard]}
              onPress={() => {
                setNotifications(
                  notifications.map(n => (n.id === item.id ? { ...n, read: true } : n))
                );
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
                <Ionicons name={iconInfo.name as any} size={22} color={iconInfo.color} />
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  readAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messageText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
