import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';


// Import screens from feature modules
import LoginScreen from '../features/auth/LoginScreen';
import SignupScreen from '../features/auth/SignupScreen';
import ForgotPasswordScreen from '../features/auth/ForgotPasswordScreen';

import HomeScreen from '../features/listings/HomeScreen';             // Unified home for all users
import MyListingsScreen from '../features/listings/MyListingsScreen'; // Owner listing management (via drawer)
import AddVehicleScreen from '../features/listings/AddVehicleScreen';
import VehicleDetailScreen from '../features/listings/VehicleDetailScreenRenter';
import EditVehicleScreen from '../features/listings/EditVehicleScreen';

import ProfileScreen from '../features/profile/ProfileScreen';

import BookingScreen from '../features/booking/BookingScreen';
import OwnerBookingsScreen from '../features/booking/OwnerBookingsScreen';
import MyBookingsScreen from '../features/booking/MyBookingsScreen';

import NotificationsScreen from '../features/messaging/screens/NotificationsScreen';
import ChatScreen from '../features/messaging/screens/ChatScreen';
import ChatListScreen from '../features/messaging/screens/ChatListScreen';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { session, loading } = useAuthStore();
    const { initNotifications, cleanUp } = useNotificationStore();

    useEffect(() => {
        try {
            if (session?.user?.id) {
                initNotifications(session.user.id);
            } else {
                cleanUp();
            }
        } catch (err) {
            console.warn('AppNavigator notification init error:', err);
        }
    }, [session?.user?.id]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 12, color: '#64748b' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        {/* All logged-in users go to the same HomeScreen */}
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="MyListings" component={MyListingsScreen} />
                        <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
                        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Booking" component={BookingScreen} />
                        <Stack.Screen name="OwnerBookings" component={OwnerBookingsScreen} />
                        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
                        <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Messages" component={ChatListScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}