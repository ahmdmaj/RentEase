import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

export default function VehicleDetailScreen({ route, navigation }: any) {
    const { vehicleId } = route.params;
    const [vehicle, setVehicle] = useState<any>(null);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchVehicleDetails();
    }, [vehicleId]);

    const fetchVehicleDetails = async () => {
        try {
            setLoading(true);

            // Fetch vehicle details with owner profile
            const { data: vehicleData, error: vehicleError } = await supabase
                .from('vehicles')
                .select('*, profiles(full_name, phone, avatar_url)')
                .eq('id', vehicleId)
                .single();

            if (vehicleError) throw vehicleError;
            setVehicle(vehicleData);

            // Fetch vehicle images
            const { data: imageData, error: imageError } = await supabase
                .from('vehicle_images')
                .select('image_url')
                .eq('vehicle_id', vehicleId)
                .order('display_order', { ascending: true });

            if (imageError) throw imageError;
            setImages(imageData.map((img) => img.image_url));

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!vehicle) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Vehicle not found</Text>
            </View>
        );
    }

    // Safely access profile data
    const ownerName = vehicle.profiles?.full_name || 'Owner';
    const ownerPhone = vehicle.profiles?.phone || 'Not provided';

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* Image Carousel */}
            <View style={styles.imageContainer}>
                {images.length > 0 ? (
                    <>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setCurrentImageIndex(index);
                            }}
                        >
                            {images.map((url, index) => (
                                <Image key={index} source={{ uri: url }} style={styles.image} resizeMode="cover" />
                            ))}
                        </ScrollView>
                        {/* Image Counter */}
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                                {currentImageIndex + 1} / {images.length}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.noImageContainer}>
                        <Text style={styles.noImageText}>No images available</Text>
                    </View>
                )}
            </View>

            {/* Vehicle Info */}
            <View style={styles.content}>
                <Text style={styles.title}>
                    {vehicle.make} {vehicle.model}
                </Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>LKR {vehicle.price_per_day}</Text>
                    <Text style={styles.priceUnit}>/ day</Text>
                </View>

                <View style={styles.divider} />

                {/* Specs Grid */}
                <View style={styles.specsGrid}>
                    <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Year</Text>
                        <Text style={styles.specValue}>{vehicle.year || 'N/A'}</Text>
                    </View>
                    <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Transmission</Text>
                        <Text style={styles.specValue}>{vehicle.transmission || 'N/A'}</Text>
                    </View>
                    <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Fuel</Text>
                        <Text style={styles.specValue}>{vehicle.fuel_type || 'N/A'}</Text>
                    </View>
                    <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Seats</Text>
                        <Text style={styles.specValue}>{vehicle.seating_capacity || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Location */}
                <View style={styles.locationContainer}>
                    <Text style={styles.sectionLabel}>📍 Location</Text>
                    <Text style={styles.locationText}>{vehicle.location}</Text>
                </View>

                {/* Description */}
                {vehicle.description && (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.sectionLabel}>📝 Description</Text>
                        <Text style={styles.descriptionText}>{vehicle.description}</Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* Owner Info */}
                <View style={styles.ownerContainer}>
                    <Text style={styles.sectionLabel}>👤 Owner</Text>
                    <View style={styles.ownerDetails}>
                        <View style={styles.ownerAvatar}>
                            <Text style={styles.ownerAvatarText}>
                                {ownerName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>{ownerName}</Text>
                            <Text style={styles.ownerPhone}>📞 {ownerPhone}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Book Button */}
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => Alert.alert('Booking', 'Booking feature coming soon!')}
                >
                    <Text style={styles.bookButtonText}>📅 Book This Vehicle</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
    },
    // Image Section
    imageContainer: {
        width: width,
        height: 300,
        backgroundColor: '#e2e8f0',
        position: 'relative',
    },
    image: {
        width: width,
        height: 300,
    },
    noImageContainer: {
        width: width,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 16,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    // Content
    content: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    price: {
        fontSize: 28,
        fontWeight: '700',
        color: '#16a34a',
    },
    priceUnit: {
        fontSize: 16,
        color: '#64748b',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 16,
    },
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    specItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    specLabel: {
        fontSize: 12,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    specValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    locationContainer: {
        marginBottom: 8,
    },
    locationText: {
        fontSize: 16,
        color: '#475569',
    },
    descriptionContainer: {
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
    },
    ownerContainer: {
        marginBottom: 8,
    },
    ownerDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ownerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ownerAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    ownerInfo: {
        flex: 1,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    ownerPhone: {
        fontSize: 14,
        color: '#64748b',
    },
    bookButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 40,
    },
});