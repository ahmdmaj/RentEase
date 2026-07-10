import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: string;
  read: boolean;
  targetScreen?: string;
  data?: any;
}

const getIconInfo = (type: string) => {
  switch (type) {
    // Renter
    case 'renter_booking_approved':
      return { name: 'checkmark-circle-outline', color: '#16a34a', bg: '#dcfce7' }; // Green
    case 'renter_booking_rejected':
      return { name: 'close-circle-outline', color: '#dc2626', bg: '#fee2e2' }; // Red
    case 'renter_rental_starts':
      return { name: 'car-sport-outline', color: '#2563eb', bg: '#dbeafe' }; // Blue
    case 'renter_leave_review':
      return { name: 'star-outline', color: '#d97706', bg: '#fef3c7' }; // Amber
    // Owner
    case 'owner_booking_request':
      return { name: 'cart-outline', color: '#2563eb', bg: '#dbeafe' };
    case 'owner_vehicle_approved':
      return { name: 'thumbs-up-outline', color: '#16a34a', bg: '#dcfce7' };
    case 'owner_booking_completed':
      return { name: 'flag-outline', color: '#0891b2', bg: '#cffafe' }; // Cyan
    case 'owner_booking_cancelled':
      return { name: 'trash-outline', color: '#dc2626', bg: '#fee2e2' };
    // Admin
    case 'admin_new_vehicle':
      return { name: 'car-outline', color: '#7c3aed', bg: '#ede9fe' }; // Purple
    // System
    case 'system_welcome':
      return { name: 'gift-outline', color: '#ec4899', bg: '#fce7f3' }; // Pink
    case 'system_email_changed':
      return { name: 'mail-outline', color: '#64748b', bg: '#f1f5f9' }; // Slate
    case 'system_password_reset':
      return { name: 'key-outline', color: '#f59e0b', bg: '#fef3c7' };
    default:
      return { name: 'notifications-outline', color: '#64748b', bg: '#f1f5f9' };
  }
};

const getTargetScreenForType = (type: string): string | undefined => {
  switch (type) {
    case 'owner_booking_request':
    case 'owner_booking_cancelled':
    case 'owner_booking_completed':
      return 'OwnerBookings';
    case 'renter_booking_approved':
    case 'renter_booking_rejected':
    case 'renter_rental_starts':
    case 'renter_leave_review':
      return 'MyBookings';
    case 'owner_vehicle_approved':
      return 'MyListings';
    case 'admin_new_vehicle':
      return 'AdminDashboard';
    default:
      return undefined;
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Welcome to RentEase! 🚗',
    message: 'Explore top-rated vehicles or list your own car to start earning today.',
    time: 'Just now',
    type: 'system_welcome',
    read: false,
  },
  {
    id: '2',
    title: 'Instant Booking Available',
    message: 'Look for the green available tag to book cars instantly near your location.',
    time: '2 hours ago',
    type: 'system_welcome',
    read: false,
  },
  {
    id: '3',
    title: 'Listing Tip 💡',
    message: 'Add clear, well-lit photos of your car to get up to 3x more bookings.',
    time: '1 day ago',
    type: 'system_welcome',
    read: true,
  },
];

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications(INITIAL_NOTIFICATIONS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        const mappedList: NotificationItem[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.body,
          time: formatTimeAgo(n.created_at),
          type: n.type,
          read: n.is_read,
          data: n.data,
          targetScreen: getTargetScreenForType(n.type),
        }));
        setNotifications(mappedList);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(item => ({ ...item, read: true })));
    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      } catch (err) {
        console.error('Error marking all read:', err);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const iconInfo = getIconInfo(item.type);
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.unreadCard]}
              onPress={async () => {
                setNotifications(
                  notifications.map(n => (n.id === item.id ? { ...n, read: true } : n))
                );
                if (!item.read && user) {
                  try {
                    await supabase
                      .from('notifications')
                      .update({ is_read: true })
                      .eq('id', item.id);
                  } catch (err) {
                    console.error('Error marking notification read:', err);
                  }
                }
                if (item.targetScreen) {
                  navigation.navigate(item.targetScreen);
                }
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
