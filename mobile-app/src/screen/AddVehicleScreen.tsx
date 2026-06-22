import React, { useState } from 'react';
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
import { useAuthStore } from '../store/authstore';

export default function AddVehicleScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async () => {
        // Basic validation
        if (!make || !model || !location || !pricePerDay) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);

        const { data, error } = await supabase
            .from('vehicles')
            .insert({
                owner_id: user?.id,
                make,
                model,
                year: parseInt(year) || null,
                transmission,
                fuel_type: fuelType,
                seating_capacity: parseInt(seatingCapacity) || null,
                location,
                price_per_day: parseFloat(pricePerDay),
                description,
                is_available: true,
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Vehicle listed successfully!');
            // Navigate back to Home and refresh the list
            navigation.navigate('Home');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>List Your Vehicle</Text>
            <Text style={styles.subtitle}>Earn money by renting out your car</Text>

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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>List Vehicle</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 16, color: '#64748b', marginBottom: 24 },
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
    submitButton: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});