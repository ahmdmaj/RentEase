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
    Image,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import DropdownPicker from '../../components/DropdownPicker';
import { VEHICLE_MAKES, VEHICLE_MODELS, SRI_LANKA_DISTRICTS } from '../../constants/vehicleData';

const generateUUID = () => {
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

export default function AddVehicleScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    // Form state
    const [make, setMake] = useState('');
    const [customMake, setCustomMake] = useState('');
    const [model, setModel] = useState('');
    const [customModel, setCustomModel] = useState('');
    const [year, setYear] = useState('');
    const [transmission, setTransmission] = useState('Automatic');
    const [fuelType, setFuelType] = useState('Petrol');
    const [seatingCapacity, setSeatingCapacity] = useState('');
    const [location, setLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [description, setDescription] = useState('');

    const modelOptions = make && VEHICLE_MODELS[make] ? VEHICLE_MODELS[make] : ['Other'];

    // --- IMAGE PICKING LOGIC ---
    const pickImages = async () => {
        // Request permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your gallery to upload images.');
            return;
        }

        // Launch image picker (allow multiple selection)
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.7, // Compress to save space
            selectionLimit: 5,
        });

        if (!result.canceled && result.assets) {
            // Extract the URIs (local paths) from the result
            const selectedUris = result.assets.map(asset => asset.uri);
            setImages(selectedUris);
        }
    };

    // Remove a selected image (if user wants to deselect)
    const removeImage = (indexToRemove: number) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    // --- UPLOAD FUNCTION ---
    const uploadImages = async (vehicleId: string): Promise<boolean> => {
        try {
            for (let i = 0; i < images.length; i++) {
                const uri = images[i];

                // Generate a unique file name using UUID to prevent overwrite/collision attacks
                const fileExt = uri.split('.').pop();
                const fileName = `${generateUUID()}.${fileExt}`;
                const filePath = `${vehicleId}/${fileName}`; // Store in a folder named after the vehicle

                // Get current auth token for upload
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;

                // Use Expo FileSystem to natively upload the file (bypasses RN fetch bugs)
                const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
                const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
                console.log('[DEBUG-UPLOAD] Starting FileSystem upload to', `${supabaseUrl}/storage/v1/object/vehicle-images/${filePath}`);
                const uploadResult = await FileSystem.uploadAsync(
                    `${supabaseUrl}/storage/v1/object/vehicle-images/${filePath}`,
                    uri,
                    {
                        httpMethod: 'POST',
                        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
                        headers: {
                            Authorization: `Bearer ${token}`,
                            apikey: anonKey || '',
                            'Content-Type': `image/${fileExt}`,
                            'x-upsert': 'false',
                        },
                    }
                );

                console.log('[DEBUG-UPLOAD] FileSystem upload complete. Status:', uploadResult.status, 'Body:', uploadResult.body);

                if (uploadResult.status !== 200) {
                    console.error('[DEBUG-UPLOAD] Upload error for image', i, uploadResult);
                    Alert.alert('Upload Failed', `Image ${i + 1} failed to upload. Please try again with a valid image under 5MB.`);
                    return false;
                }

                // Get the public URL
                const { data: urlData } = supabase.storage
                    .from('vehicle-images')
                    .getPublicUrl(filePath);

                const publicUrl = urlData.publicUrl;
                console.log('[DEBUG-UPLOAD] Public URL generated:', publicUrl);

                // Save the URL to the vehicle_images table
                const { error: dbError } = await supabase
                    .from('vehicle_images')
                    .insert({
                        vehicle_id: vehicleId,
                        image_url: publicUrl,
                        display_order: i,
                    });

                if (dbError) {
                    console.error('[DEBUG-UPLOAD] DB insert error for image', i, dbError);
                    Alert.alert('Error', `Failed to save image ${i + 1}. Please try again.`);
                    return false;
                }
                
                console.log('[DEBUG-UPLOAD] DB insert complete for image', i);
            }
            return true;
        } catch (error: any) {
            console.error('[DEBUG-UPLOAD] Catch block triggered:', error);
            Alert.alert('Upload Error', 'An error occurred during upload.');
            return false;
        }
    };

    // --- SUBMIT HANDLER (UPDATED) ---
    const handleSubmit = async () => {
        const finalMake = make === 'Other' ? customMake.trim() : make;
        const finalModel = model === 'Other' ? customModel.trim() : model;
        const finalLocation = location === 'Other' ? customLocation.trim() : location;

        // Basic validation
        if (!finalMake || !finalModel || !finalLocation || !pricePerDay) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);

        // 1. Insert the vehicle first to get the ID
        const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
                owner_id: user?.id,
                make: finalMake,
                model: finalModel,
                year: parseInt(year) || null,
                transmission,
                fuel_type: fuelType,
                seating_capacity: parseInt(seatingCapacity) || null,
                location: finalLocation,
                price_per_day: parseFloat(pricePerDay),
                description,
                is_available: false, // Must be granted by admin before appearing on site
            })
            .select()
            .single();

        if (vehicleError) {
            setLoading(false);
            Alert.alert('Error', 'Failed to create vehicle listing. Please try again.');
            return;
        }

        const vehicleId = vehicleData.id;

        // 2. Upload images (if any were selected)
        let uploadSuccess = true;
        if (images.length > 0) {
            uploadSuccess = await uploadImages(vehicleId);
        }

        setLoading(false);

        if (uploadSuccess) {
            Alert.alert(
                '⏳ Under Admin Check',
                'Your vehicle details have been submitted and are under admin check. Once granted by the admin, your vehicle will be listed on the site soon!',
                [{ text: 'Got It', onPress: () => navigation.navigate('Home') }]
            );
        } else {
            Alert.alert(
                '⏳ Under Admin Check',
                'Your vehicle has been submitted and is under admin check. Some images failed to upload, but you can edit them later. Once granted by the admin, it will be listed on the site soon!',
                [{ text: 'Got It', onPress: () => navigation.navigate('Home') }]
            );
        }
    };

    // --- RENDER UI ---
    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 50) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>List Your Vehicle</Text>
                    <Text style={styles.headerSubtitle}>Earn money by renting out your car</Text>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollContainer} 
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

            {/* Image Upload Section */}
            <View style={styles.imageSection}>
                <Text style={styles.label}>Photos (Up to 5)</Text>
                <View style={styles.imageRow}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.thumbnail} />
                            <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(index)}>
                                <Text style={styles.removeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    {images.length < 5 && (
                        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                            <Text style={styles.addImageText}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {images.length === 0 && (
                    <Text style={styles.hint}>Tap '+' to select photos from gallery</Text>
                )}
            </View>

            {/* Form Fields */}
            <DropdownPicker
                label="Make *"
                value={make}
                options={VEHICLE_MAKES}
                onSelect={(val) => {
                    setMake(val);
                    setModel('');
                    if (val !== 'Other') setCustomMake('');
                    if (val !== 'Other') setCustomModel('');
                }}
                placeholder="Select vehicle brand"
            />
            {make === 'Other' && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Custom Brand Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={customMake}
                        onChangeText={setCustomMake}
                        placeholder="e.g., Peugeot, Volvo..."
                    />
                </View>
            )}

            <DropdownPicker
                label="Model *"
                value={model}
                options={modelOptions}
                onSelect={(val) => {
                    setModel(val);
                    if (val !== 'Other') setCustomModel('');
                }}
                placeholder={make ? `Select ${make} model` : 'Select make first'}
                disabled={!make}
            />
            {(model === 'Other' || make === 'Other') && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Custom Model Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={customModel}
                        onChangeText={setCustomModel}
                        placeholder="e.g., Starlet, GT86..."
                    />
                </View>
            )}

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

            <DropdownPicker
                label="Location (District) *"
                value={location}
                options={SRI_LANKA_DISTRICTS}
                onSelect={(val) => {
                    setLocation(val);
                    if (val !== 'Other') setCustomLocation('');
                }}
                placeholder="Select Sri Lanka district"
            />
            {location === 'Other' && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Custom Location / Town *</Text>
                    <TextInput
                        style={styles.input}
                        value={customLocation}
                        onChangeText={setCustomLocation}
                        placeholder="Enter location name..."
                    />
                </View>
            )}

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
        </View>
    );
}

// --- STYLES (Updated with image styles) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContainer: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 12,
    },
    backButton: { padding: 4 },
    headerTitleGroup: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
    headerSubtitle: { fontSize: 13, color: '#64748b' },
    content: { padding: 20, paddingBottom: 100 },
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
    // Image Upload Styles
    imageSection: { marginBottom: 20 },
    imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    imageWrapper: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    thumbnail: { width: 80, height: 80, borderRadius: 10 },
    removeImage: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    removeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    addImageButton: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    addImageText: { fontSize: 32, color: '#94a3b8' },
    hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
});
