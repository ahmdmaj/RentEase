import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function VehicleDetailScreen({ navigation, route }: any) {
    const { vehicleId } = route.params || {};

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Vehicle Details</Text>
                <View style={{ width: 50 }} /> {/* Spacer */}
            </View>
            <View style={styles.content}>
                <Text style={styles.text}>Vehicle Detail View</Text>
                <Text style={styles.text}>Vehicle ID: {vehicleId}</Text>
                <Text style={styles.comingSoon}>Full detail view coming soon...</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    backButton: { fontSize: 16, color: '#2563eb' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 16, color: '#1e293b', marginBottom: 8 },
    comingSoon: { fontSize: 14, color: '#64748b', marginTop: 16, fontStyle: 'italic' },
});
