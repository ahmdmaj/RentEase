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
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function OwnerSignupScreen({ navigation }: any) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setSession } = useAuthStore();

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            // Pass full_name + role as metadata → DB trigger will auto-create
            // the profiles row via SECURITY DEFINER, bypassing RLS.
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        role: 'owner',
                    },
                },
            });

            if (signUpError) throw signUpError;
            if (!data.user) throw new Error('No user returned from signup.');

            // Optional: update phone if provided (profile row already exists via trigger)
            if (phone.trim() && data.user) {
                await supabase
                    .from('profiles')
                    .update({ phone: phone.trim() })
                    .eq('id', data.user.id);
            }

            if (data.session) {
                setSession(data.session);
            } else {
                Alert.alert(
                    'Almost there!',
                    'Your owner account was created. Check your email to confirm your address, then sign in.',
                    [{ text: 'OK', onPress: () => navigation.navigate('OwnerLogin') }]
                );
            }
        } catch (err: any) {
            Alert.alert('Registration Failed', err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
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
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
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
                            <Ionicons name="business" size={32} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Become an Owner</Text>
                    <Text style={styles.subtitle}>List your vehicles and start earning</Text>

                    {/* Full Name */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#475569"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email *</Text>
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

                    {/* Phone (optional) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Phone Number <Text style={styles.optional}>(optional)</Text></Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                placeholderTextColor="#475569"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min. 6 characters"
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

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password *</Text>
                        <View style={[
                            styles.inputWrapper,
                            confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                        ]}>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter password"
                                placeholderTextColor="#475569"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirm(!showConfirm)}
                            >
                                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                            <Text style={styles.errorText}>Passwords do not match</Text>
                        )}
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        style={styles.registerButtonWrapper}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.registerButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.registerButtonText}>Create Owner Account</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Already have account */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>already registered?</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('OwnerLogin')}
                    >
                        <Text style={styles.loginButtonText}>Sign in to Owner Portal</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
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
    scrollContent: {
        paddingHorizontal: 28,
        paddingTop: 80,
        paddingBottom: 40,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 36,
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
    optional: {
        fontWeight: '400',
        textTransform: 'none',
        color: '#475569',
        fontSize: 12,
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
    inputError: {
        borderColor: '#ef4444',
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
    errorText: {
        marginTop: 6,
        fontSize: 12,
        color: '#ef4444',
    },
    registerButtonWrapper: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    registerButton: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    registerButtonText: {
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
    loginButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    loginButtonText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 20,
    },
});
