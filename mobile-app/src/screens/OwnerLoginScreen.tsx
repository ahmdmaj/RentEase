import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerLoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.innerContainer}>

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#94a3b8" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* Icon Badge */}
                    <View style={styles.iconBadge}>
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="car-sport" size={32} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Owner Portal</Text>
                    <Text style={styles.subtitle}>Sign in to manage your listings</Text>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#475569"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#475569"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={styles.loginButtonWrapper}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.loginButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Access Owner Dashboard</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>not an owner?</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Back to Renter Login */}
                    <TouchableOpacity
                        style={styles.renterButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.renterButtonText}>Sign in as a Renter instead</Text>
                    </TouchableOpacity>

                    {/* Register as Owner */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => navigation.navigate('OwnerSignup')}
                    >
                        <Text style={styles.registerText}>
                            New owner?{' '}
                            <Text style={styles.registerLink}>Create an owner account</Text>
                        </Text>
                    </TouchableOpacity>

                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    backButton: {
        position: 'absolute',
        top: 56,
        left: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    },
    iconBadge: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    iconGradient: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#f1f5f9',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 36,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 15,
        color: '#e2e8f0',
    },
    eyeIcon: {
        padding: 6,
    },
    loginButtonWrapper: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButton: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1e293b',
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    renterButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    renterButtonText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
    registerButton: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 4,
    },
    registerText: {
        fontSize: 14,
        color: '#64748b',
    },
    registerLink: {
        color: '#60a5fa',
        fontWeight: '600',
    },
});
