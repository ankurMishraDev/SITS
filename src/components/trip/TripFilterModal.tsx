import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { TripFilters } from './TripFilterBar';
import { useParties } from '../../hooks/useParties';
import { useVehicles } from '../../hooks';

interface FilterModalProps {
  visible: boolean;
  filterKey: keyof TripFilters | null;
  currentValue: any;
  onClose: () => void;
  onApply: (value: any) => void;
}

export function TripFilterModal({ visible, filterKey, currentValue, onClose, onApply }: FilterModalProps) {
  const { data: parties } = useParties();
  const { data: vehicles } = useVehicles();
  
  const [textValue, setTextValue] = useState('');
  const [dateValue, setDateValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update state when modal opens or currentValue changes
  useEffect(() => {
    if (visible && filterKey) {
      if (filterKey === 'lrNo' || filterKey === 'originPlace' || filterKey === 'destinationPlace') {
        setTextValue(currentValue || '');
      } else if (filterKey === 'date' || filterKey === 'month') {
        setDateValue(currentValue ? new Date(currentValue) : new Date());
      }
    }
  }, [visible, filterKey, currentValue]);

  if (!filterKey) return null;

  const handleApply = () => {
    if (filterKey === 'date') {
      onApply(dateValue);
    } else if (filterKey === 'month') {
      const monthString = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
      onApply(monthString);
    } else if (filterKey === 'lrNo' || filterKey === 'originPlace' || filterKey === 'destinationPlace') {
      onApply(textValue.trim() || null);
    }
    onClose();
  };

  const renderContent = () => {
    switch (filterKey) {
      case 'partyId':
        return (
          <ScrollView style={styles.listContainer}>
            {parties?.map((party) => (
              <TouchableOpacity
                key={party.id}
                style={[
                  styles.listItem,
                  currentValue === party.id && styles.listItemActive
                ]}
                onPress={() => {
                  onApply(party.id);
                  onClose();
                }}
              >
                <Text style={[
                  styles.listItemText,
                  currentValue === party.id && styles.listItemTextActive
                ]}>
                  {party.name}
                </Text>
                {currentValue === party.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'vehicleId':
        return (
          <ScrollView style={styles.listContainer}>
            {vehicles?.map((vehicle: any) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.listItem,
                  currentValue === vehicle.id && styles.listItemActive
                ]}
                onPress={() => {
                  onApply(vehicle.id);
                  onClose();
                }}
              >
                <Text style={[
                  styles.listItemText,
                  currentValue === vehicle.id && styles.listItemTextActive
                ]}>
                  {vehicle.vehicle_no}
                </Text>
                {currentValue === vehicle.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'podStatus':
        return (
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={[
                styles.listItem,
                currentValue === 'uploaded' && styles.listItemActive
              ]}
              onPress={() => {
                onApply('uploaded');
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={[
                styles.listItemText,
                currentValue === 'uploaded' && styles.listItemTextActive
              ]}>
                POD Uploaded
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.listItem,
                currentValue === 'not_uploaded' && styles.listItemActive
              ]}
              onPress={() => {
                onApply('not_uploaded');
                onClose();
              }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={[
                styles.listItemText,
                currentValue === 'not_uploaded' && styles.listItemTextActive
              ]}>
                POD Not Uploaded
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'date':
      case 'month':
        return (
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={24} color={Colors.primary} />
              <Text style={styles.dateText}>
                {filterKey === 'date' 
                  ? dateValue.toLocaleDateString()
                  : `${dateValue.toLocaleString('default', { month: 'long' })} ${dateValue.getFullYear()}`
                }
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dateValue}
                mode={filterKey === 'month' ? 'date' : 'date'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateValue(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'lrNo':
      case 'originPlace':
      case 'destinationPlace':
        return (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={textValue}
              onChangeText={setTextValue}
              placeholder={`Enter ${filterKey === 'lrNo' ? 'LR Number' : filterKey === 'originPlace' ? 'Origin Place' : 'Destination Place'}`}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles: Record<keyof TripFilters, string> = {
      partyId: 'Select Party',
      vehicleId: 'Select Vehicle',
      lrNo: 'Enter LR Number',
      date: 'Select Date',
      month: 'Select Month',
      podStatus: 'POD Status',
      originPlace: 'Enter Origin',
      destinationPlace: 'Enter Destination',
    };
    return titles[filterKey] || 'Filter';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  listContainer: {
    maxHeight: 400,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  listItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  listItemTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  dateContainer: {
    padding: Spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textInputContainer: {
    padding: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  applyButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    fontWeight: '500',
  },
});
