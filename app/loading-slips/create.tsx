import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Card, Button, Loading } from '../../src/components';
import { useParties } from '../../src/hooks/useParties';
import { useCreateLoadingSlip, useUpdateLoadingSlip, useLoadingSlip } from '../../src/hooks/useLoadingSlips';

export default function LoadingSlipFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEdit = !!params.id;
  
  const { data: parties } = useParties();
  const { data: existingSlip, loading: loadingSlip } = useLoadingSlip(params.id as string || '');
  const { createLoadingSlip, loading: creating } = useCreateLoadingSlip();
  const { updateLoadingSlip, loading: updating } = useUpdateLoadingSlip();

  // Form state
  const [partyId, setPartyId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [originPlace, setOriginPlace] = useState('');
  const [destinationPlace, setDestinationPlace] = useState('');
  const [tripDate, setTripDate] = useState(new Date());
  const [freightAmount, setFreightAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPartyPicker, setShowPartyPicker] = useState(false);

  // Load existing data for edit
  useEffect(() => {
    if (existingSlip) {
      setPartyId(existingSlip.party_id);
      setVehicleNo(existingSlip.vehicle_no);
      setOriginPlace(existingSlip.origin_place);
      setDestinationPlace(existingSlip.destination_place);
      setTripDate(new Date(existingSlip.trip_date));
      setFreightAmount(existingSlip.freight_amount.toString());
      setAdvanceAmount(existingSlip.advance_amount.toString());
      setMaterialDescription(existingSlip.material_description || '');
      setLrNo(existingSlip.lr_no);
      setNotes(existingSlip.notes || '');
    }
  }, [existingSlip]);

  const handleSubmit = async () => {
    // Validation
    if (!partyId) {
      Alert.alert('Error', 'Please select a party');
      return;
    }
    if (!vehicleNo.trim()) {
      Alert.alert('Error', 'Please enter vehicle number');
      return;
    }
    if (!originPlace.trim()) {
      Alert.alert('Error', 'Please enter origin place');
      return;
    }
    if (!destinationPlace.trim()) {
      Alert.alert('Error', 'Please enter destination place');
      return;
    }
    if (!lrNo.trim()) {
      Alert.alert('Error', 'Please enter LR number');
      return;
    }
    if (!freightAmount || parseFloat(freightAmount) <= 0) {
      Alert.alert('Error', 'Please enter valid freight amount');
      return;
    }

    const slipData = {
      party_id: partyId,
      vehicle_no: vehicleNo.trim().toUpperCase(),
      origin_place: originPlace.trim(),
      destination_place: destinationPlace.trim(),
      trip_date: tripDate.toISOString().split('T')[0],
      freight_amount: parseFloat(freightAmount),
      advance_amount: parseFloat(advanceAmount || '0'),
      material_description: materialDescription.trim(),
      lr_no: lrNo.trim().toUpperCase(),
      notes: notes.trim(),
    };

    try {
      if (isEdit) {
        await updateLoadingSlip(params.id as string, slipData);
        Alert.alert('Success', 'Loading slip updated successfully');
        router.back();
      } else {
        const newSlip = await createLoadingSlip(slipData);
        Alert.alert('Success', 'Loading slip created successfully', [
          {
            text: 'OK',
            onPress: () => router.replace(`/loading-slips/${newSlip.id}`),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', isEdit ? 'Failed to update loading slip' : 'Failed to create loading slip');
    }
  };

  if (isEdit && loadingSlip) {
    return <Loading />;
  }

  const selectedParty = parties?.find(p => p.id === partyId);

  return (
    <>
      <Stack.Screen
        options={{
          title: isEdit ? 'Edit Loading Slip' : 'Create Loading Slip',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Party Details</Text>
          
          {/* Party Picker */}
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPartyPicker(!showPartyPicker)}
          >
            <View style={styles.pickerContent}>
              <Ionicons name="people" size={20} color={Colors.textSecondary} />
              <Text style={[styles.pickerText, !selectedParty && styles.placeholderText]}>
                {selectedParty?.name || 'Select Party'}
              </Text>
            </View>
            <Ionicons 
              name={showPartyPicker ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>

          {showPartyPicker && (
            <View style={styles.pickerList}>
              <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                {parties?.map((party) => (
                  <TouchableOpacity
                    key={party.id}
                    style={[
                      styles.pickerItem,
                      partyId === party.id && styles.pickerItemActive
                    ]}
                    onPress={() => {
                      setPartyId(party.id);
                      setShowPartyPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      partyId === party.id && styles.pickerItemTextActive
                    ]}>
                      {party.name}
                    </Text>
                    {partyId === party.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          {/* Vehicle Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="car" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={vehicleNo}
                onChangeText={setVehicleNo}
                placeholder="Enter vehicle number"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* LR Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>LR Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={lrNo}
                onChangeText={setLrNo}
                placeholder="Enter LR number"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Origin Place */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origin Place *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={originPlace}
                onChangeText={setOriginPlace}
                placeholder="Enter origin place"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Destination Place */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination Place *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={destinationPlace}
                onChangeText={setDestinationPlace}
                placeholder="Enter destination place"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Trip Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trip Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
              <Text style={styles.dateText}>
                {tripDate.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={tripDate}
                mode="date"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setTripDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Material Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Material Description</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cube" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={materialDescription}
                onChangeText={setMaterialDescription}
                placeholder="Enter material description"
                placeholderTextColor={Colors.textLight}
                multiline
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pencil" size={20} color={Colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes or remarks"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          {/* Freight Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Freight Amount *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color={Colors.textSecondary} />
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                value={freightAmount}
                onChangeText={setFreightAmount}
                placeholder="Enter freight amount"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Advance Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Advance Amount</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color={Colors.textSecondary} />
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                placeholder="Enter advance amount"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Balance Display */}
          {freightAmount && (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Balance Amount</Text>
              <Text style={styles.balanceAmount}>
                ₹{(parseFloat(freightAmount || '0') - parseFloat(advanceAmount || '0')).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </Card>

        <Button
          title={isEdit ? 'Update Loading Slip' : 'Create Loading Slip'}
          onPress={handleSubmit}
          loading={creating || updating}
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencySymbol: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickerText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  pickerList: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    maxHeight: 200,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  pickerItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  pickerItemTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  balanceLabel: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.warning,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
