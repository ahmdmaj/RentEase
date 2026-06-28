import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OwnerLoginScreen from '../screens/OwnerLoginScreen'; // Owner login
import OwnerSignupScreen from '../screens/OwnerSignupScreen'; // Owner signup
import HomeScreen from '../screens/HomeScreen';             // Renter view
import OwnerHomeScreen from '../screens/OwnerHomeScreen';   // Owner view
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreenRenter';

import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { session, user, loading } = useAuthStore();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    // Fetch user role from profiles table
    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user) {
                setRoleLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle(); // returns null instead of error when 0 rows

                if (error) throw error;

                if (data) {
                    setUserRole(data.role || 'renter');
                } else {
                    // Profile row missing — create it now as a fallback
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        role: 'renter',
                    });
                    setUserRole('renter');
                }
            } catch (error) {
                console.error('Error fetching role:', error);
                setUserRole('renter');
            } finally {
                setRoleLoading(false);
            }
        };

        fetchUserRole();
    }, [user]);

    if (loading || roleLoading) {
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
                        {/* Show different Home based on role */}
                        {userRole === 'owner' ? (
                            <Stack.Screen name="Home" component={OwnerHomeScreen} />
                        ) : (
                            <Stack.Screen name="Home" component={HomeScreen} />
                        )}
                        <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
                        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} />
                        <Stack.Screen name="OwnerSignup" component={OwnerSignupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}