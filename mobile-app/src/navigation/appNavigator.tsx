import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screen/loginscreen';
import SignupScreen from '../screen/signupscreen';
import HomeScreen from '../screen/homescreen';
import AddVehicleScreen from '../screen/AddVehicleScreen';

import { useAuthStore } from '../store/authstore';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { session, loading } = useAuthStore();

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}