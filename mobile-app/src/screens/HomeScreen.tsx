import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTranslateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerTranslateX, {
      toValue: DRAWER_WIDTH,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  // FAB animation
  const fabScale = useRef(new Animated.Value(1)).current;
  const onFabPressIn = () => {
    Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
  };
  const onFabPressOut = () => {
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all, car, van, bike

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, profiles(full_name)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setVehicles(data || []);
      setFilteredVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVehicles();
    });
    return unsubscribe;
  }, [navigation]);

  // Apply Search & Filters
  const applyFilters = () => {
    let results = [...vehicles];

    // 1. Search by make/model
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.make.toLowerCase().includes(query) ||
          item.model.toLowerCase().includes(query)
      );
    }

    // 2. Filter by price range
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    results = results.filter(
      (item) => item.price_per_day >= min && item.price_per_day <= max
    );

    // 3. Filter by vehicle type (using make as proxy for demo)
    if (selectedType !== 'all') {
      const typeMap: Record<string, string[]> = {
        car: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Suzuki', 'Mitsubishi'],
        van: ['Toyota', 'Nissan', 'Mitsubishi', 'Mercedes'], // Van models
        bike: ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Ducati'],
      };
      const allowedMakes = typeMap[selectedType] || [];
      results = results.filter((item) =>
        allowedMakes.some((make) => item.make.toLowerCase().includes(make.toLowerCase()))
      );
    }

    setFilteredVehicles(results);
    setShowFilterModal(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedType('all');
    setFilteredVehicles(vehicles);
    setShowFilterModal(false);
  };

  const handleSignOut = async () => {
    await signOut();
    Alert.alert('Signed Out', 'You have been logged out.');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 RentEase</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notificationIconBtn}>
          <Ionicons name="notifications-outline" size={28} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Side Drawer Overlay */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Side Drawer Panel */}
      {drawerOpen && (
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}
        >
          {/* Drawer Header / Profile */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerAvatarCircle}>
              <Ionicons name="person" size={36} color="#2563eb" />
            </View>
            <TouchableOpacity
              onPress={() => { closeDrawer(); navigation.navigate('Profile'); }}
              activeOpacity={0.7}
            >
              <Text style={styles.drawerProfileName}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Profile'}
              </Text>
              <Text style={styles.drawerProfileEmail}>{user?.email || ''}</Text>
              <Text style={styles.drawerEditHint}>Tap to edit profile →</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.drawerDivider} />

          {/* Drawer Menu Items */}
          <View style={styles.drawerMenuItems}>
            <TouchableOpacity
              style={styles.drawerMenuItem}
              onPress={() => { closeDrawer(); navigation.navigate('MyBookings'); }}
            >
              <Ionicons name="calendar-outline" size={22} color="#2563eb" />
              <Text style={styles.drawerMenuText}>My Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerMenuItem}
              onPress={() => { closeDrawer(); navigation.navigate('MyListings'); }}
            >
              <Ionicons name="car-sport-outline" size={22} color="#2563eb" />
              <Text style={styles.drawerMenuText}>Your Listings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerMenuItem}
              onPress={() => { closeDrawer(); navigation.navigate('OwnerBookings'); }}
            >
              <Ionicons name="clipboard-outline" size={22} color="#2563eb" />
              <Text style={styles.drawerMenuText}>Booking Requests</Text>
            </TouchableOpacity>
          </View>

          {/* Logout at Bottom */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.drawerLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by make or model..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Auto-apply search as user types
              setTimeout(() => applyFilters(), 100);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
              <Text style={styles.cardSubtitle}>📍 {item.location}</Text>
              <Text style={styles.cardPrice}>LKR {item.price_per_day} / day</Text>
              {item.profiles && (
                <Text style={styles.cardOwner}>👤 {item.profiles.full_name || 'Owner'}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No vehicles match your search.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 110 }}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔽 Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Price Range */}
              <Text style={styles.filterLabel}>💰 Price Range (LKR)</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.priceDash}>—</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Any"
                    placeholderTextColor="#94a3b8"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Vehicle Type */}
              <Text style={[styles.filterLabel, { marginTop: 20 }]}>🚗 Vehicle Type</Text>
              <View style={styles.typeContainer}>
                {['all', 'car', 'van', 'bike'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      selectedType === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        selectedType === type && styles.typeTextSelected,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.clearButton]} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <Ionicons name="home" size={24} color="#fff" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          {/* Central FAB — navigates to My Listings */}
          <View style={styles.fabWrapper}>
            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('MyListings')}
                onPressIn={onFabPressIn}
                onPressOut={onFabPressOut}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.fabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add" size={30} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

          </View>

          <TouchableOpacity style={styles.navItem} onPress={openDrawer}>
            <Ionicons name="person" size={24} color="rgba(255,255,255,0.6)" />
            <Text style={[styles.navLabel, { color: 'rgba(255,255,255,0.6)' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  notificationIconBtn: { padding: 4 },

  // Drawer
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    flexDirection: 'column',
  },
  drawerHeader: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f0f6ff',
    gap: 12,
  },
  drawerAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  drawerProfileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  drawerProfileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  drawerEditHint: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '500',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 0,
  },
  drawerMenuItems: {
    flex: 1,
    paddingTop: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  drawerMenuText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  drawerLogoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },

  // Results
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  resultsText: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: { gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  cardSubtitle: { fontSize: 14, color: '#64748b' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#16a34a', marginTop: 4 },
  cardOwner: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  // Empty State
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  emptyButton: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: '#fff', fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  priceInput: {
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 4,
  },
  priceDash: {
    fontSize: 20,
    color: '#94a3b8',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeText: {
    color: '#475569',
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f1f5f9',
  },
  clearButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    width: '100%',
    height: 68,
    borderRadius: 34,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
    marginTop: 2,
  },
  fabWrapper: {
    alignItems: 'center',
    top: -28,
  },
  fabGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#f8fafc',
  },
  fabLabel: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});