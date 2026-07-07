import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownPickerProps {
    label?: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function DropdownPicker({
    label,
    value,
    options,
    onSelect,
    placeholder = 'Select an option',
    disabled = false,
}: DropdownPickerProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = options.filter((opt) =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (item: string) => {
        onSelect(item);
        setModalVisible(false);
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TouchableOpacity
                style={[styles.selector, disabled && styles.disabledSelector]}
                onPress={() => !disabled && setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.valueText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={20}
                    color={disabled ? '#cbd5e1' : '#64748b'}
                />
            </TouchableOpacity>

            <Modal
                transparent
                animationType="fade"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                    />
                    <SafeAreaView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || placeholder}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#334155" />
                            </TouchableOpacity>
                        </View>

                        {options.length > 8 && (
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={18} color="#94a3b8" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search options..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#94a3b8"
                                />
                                {searchQuery ? (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        )}

                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item, idx) => `${item}-${idx}`}
                            style={styles.list}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const isSelected = item === value;
                                return (
                                    <TouchableOpacity
                                        style={[styles.optionRow, isSelected && styles.selectedRow]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No matching options found.</Text>
                                </View>
                            }
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 6,
    },
    selector: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    disabledSelector: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
    },
    valueText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '400',
    },
    placeholderText: {
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    closeButton: {
        padding: 4,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        height: 40,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
    },
    list: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    selectedRow: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        borderRadius: 8,
        borderBottomColor: 'transparent',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
    },
    selectedOptionText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 15,
    },
});
