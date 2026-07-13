import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';


// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';             // Unified home for all users
import MyListingsScreen from '../screens/MyListingsScreen'; // Owner listing management (via drawer)
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreenRenter';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import BookingScreen from '../screens/BookingScreen';
import OwnerBookingsScreen from '../screens/OwnerBookingsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import EditVehicleScreen from '../screens/EditVehicleScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import MessagesScreen from '../screens/MessagesScreen';

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
                        <Stack.Screen name="Messages" component={MessagesScreen} />
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