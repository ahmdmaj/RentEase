import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens (we will create these next)
import LoginScreen from '../screen/loginscreen';
import SignupScreen from '../screen/signupscreen';
import HomeScreen from '../screen/homescreen';

import { useAuthStore } from '../store/authstore';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { session, loading } = useAuthStore();

    if (loading) {
        // You can return a splash screen/loading spinner here if you want
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    // User is logged in
                    <Stack.Screen name="Home" component={HomeScreen} />
                ) : (
                    // User is logged out
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}