import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function EditVehicleScreen({ route, navigation }: any) {
    const { vehicleId } = route.params;
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [transmission, setTransmission] = useState('Automatic');
    const [fuelType, setFuelType] = useState('Petrol');
    const [seatingCapacity, setSeatingCapacity] = useState('');
    const [location, setLocation] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [description, setDescription] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        fetchVehicleDetails();
    }, [vehicleId]);

    const fetchVehicleDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', vehicleId)
                .single();

            if (error) throw error;

            if (data) {
                setMake(data.make);
                setModel(data.model);
                setYear(data.year?.toString() || '');
                setTransmission(data.transmission || 'Automatic');
                setFuelType(data.fuel_type || 'Petrol');
                setSeatingCapacity(data.seating_capacity?.toString() || '');
                setLocation(data.location);
                setPricePerDay(data.price_per_day?.toString() || '');
                setDescription(data.description || '');
                setIsAvailable(data.is_available);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to update a vehicle.');
            return;
        }

        if (!make || !model || !location || !pricePerDay) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSaving(true);

        const { error } = await supabase
            .from('vehicles')
            .update({
                make,
                model,
                year: parseInt(year) || null,
                transmission,
                fuel_type: fuelType,
                seating_capacity: parseInt(seatingCapacity) || null,
                location,
                price_per_day: parseFloat(pricePerDay),
                description,
                is_available: isAvailable,
            })
            .eq('id', vehicleId)
            .eq('owner_id', user?.id);

        setSaving(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Vehicle updated successfully!');
            navigation.goBack();
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Vehicle',
            'Are you sure you want to delete this vehicle? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user) return;
                        setDeleting(true);
                        const { error } = await supabase
                            .from('vehicles')
                            .delete()
                            .eq('id', vehicleId)
                            .eq('owner_id', user?.id);

                        setDeleting(false);

                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            Alert.alert('Success', 'Vehicle deleted successfully.');
                            navigation.navigate('Home');
                        }
                    },
                },
            ]
        );
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
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Vehicle</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>

            {/* Availability Toggle */}
            <View style={styles.availabilityContainer}>
                <Text style={styles.sectionLabel}>🔘 Availability</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleOption, isAvailable && styles.toggleActive]}
                        onPress={() => setIsAvailable(true)}
                    >
                        <Text style={[styles.toggleText, isAvailable && styles.toggleTextActive]}>✅ Available</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleOption, !isAvailable && styles.toggleInactive]}
                        onPress={() => setIsAvailable(false)}
                    >
                        <Text style={[styles.toggleText, !isAvailable && styles.toggleTextInactive]}>🚫 Unavailable</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Form Fields */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Make *</Text>
                <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="e.g., Toyota" />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Model *</Text>
                <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="e.g., Allion" />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Year</Text>
                    <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="2020" keyboardType="numeric" />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Seats</Text>
                    <TextInput style={styles.input} value={seatingCapacity} onChangeText={setSeatingCapacity} placeholder="4" keyboardType="numeric" />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Transmission</Text>
                    <View style={styles.pickerContainer}>
                        <TouchableOpacity style={[styles.pickerOption, transmission === 'Automatic' && styles.pickerSelected]} onPress={() => setTransmission('Automatic')}>
                            <Text style={[styles.pickerText, transmission === 'Automatic' && styles.pickerTextSelected]}>Auto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.pickerOption, transmission === 'Manual' && styles.pickerSelected]} onPress={() => setTransmission('Manual')}>
                            <Text style={[styles.pickerText, transmission === 'Manual' && styles.pickerTextSelected]}>Manual</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Fuel</Text>
                    <View style={styles.pickerContainer}>
                        {['Petrol', 'Diesel', 'Hybrid'].map((type) => (
                            <TouchableOpacity key={type} style={[styles.pickerOption, fuelType === type && styles.pickerSelected]} onPress={() => setFuelType(type)}>
                                <Text style={[styles.pickerText, fuelType === type && styles.pickerTextSelected]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Location *</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g., Colombo" />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Price per Day (LKR) *</Text>
                <TextInput style={styles.input} value={pricePerDay} onChangeText={setPricePerDay} placeholder="1500" keyboardType="numeric" />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the vehicle condition..." multiline numberOfLines={4} />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>💾 Update Vehicle</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>🗑️ Delete Vehicle</Text>}
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContainer: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, paddingBottom: 40 },
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
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    sectionLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    availabilityContainer: { marginBottom: 20 },
    toggleContainer: { flexDirection: 'row', gap: 12 },
    toggleOption: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: 'transparent' },
    toggleActive: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
    toggleInactive: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
    toggleText: { fontWeight: '500', color: '#64748b' },
    toggleTextActive: { color: '#16a34a' },
    toggleTextInactive: { color: '#dc2626' },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    pickerContainer: { flexDirection: 'row', gap: 8 },
    pickerOption: { flex: 1, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    pickerSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    pickerText: { color: '#475569', fontWeight: '500' },
    pickerTextSelected: { color: '#fff' },
    updateButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    updateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    deleteButton: { backgroundColor: '#fee2e2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
    deleteButtonText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
    bottomSpacer: { height: 20 },
});