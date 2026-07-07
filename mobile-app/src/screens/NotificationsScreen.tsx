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
  type: 'booking' | 'system' | 'promo';
  read: boolean;
  targetScreen?: string;
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
      const dynamicList: NotificationItem[] = [];

      // 1. Fetch pending bookings for vehicles owned by this user (if owner)
      const { data: ownerBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          created_at,
          vehicles!inner ( make, model, owner_id ),
          profiles ( full_name )
        `)
        .eq('vehicles.owner_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ownerBookings && ownerBookings.length > 0) {
        ownerBookings.forEach((b: any) => {
          dynamicList.push({
            id: `owner-${b.id}`,
            title: '🚗 New Booking Request!',
            message: `${b.profiles?.full_name || 'A renter'} requested to book your ${b.vehicles?.make} ${b.vehicles?.model} for LKR ${b.total_price}. Tap to review and Accept or Reject!`,
            time: formatTimeAgo(b.created_at),
            type: 'booking',
            read: false,
            targetScreen: 'OwnerBookings',
          });
        });
      }

      // 2. Fetch approved/rejected bookings for this renter
      const { data: renterBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          created_at,
          vehicles ( make, model )
        `)
        .eq('renter_id', user.id)
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (renterBookings && renterBookings.length > 0) {
        renterBookings.forEach((b: any) => {
          const isApproved = b.status === 'approved';
          dynamicList.push({
            id: `renter-${b.id}`,
            title: isApproved ? '✅ Booking Approved!' : '❌ Booking Rejected',
            message: `Your booking request for ${b.vehicles?.make} ${b.vehicles?.model} was ${b.status} by the vehicle owner.`,
            time: formatTimeAgo(b.created_at),
            type: 'booking',
            read: false,
            targetScreen: 'MyBookings',
          });
        });
      }

      // Combine with system tips
      setNotifications([...dynamicList, ...INITIAL_NOTIFICATIONS]);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications(INITIAL_NOTIFICATIONS);
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
          const iconInfo = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.unreadCard]}
              onPress={() => {
                setNotifications(
                  notifications.map(n => (n.id === item.id ? { ...n, read: true } : n))
                );
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
