import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useParties, useSuppliers, useVehicles, useCreateTrip } from '../../src/hooks';
import { Button, TextInput, Select, DatePicker, Loading } from '../../src/components';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';

export default function CreateTripScreen() {
  const router = useRouter();
  const { data: parties, isLoading: partiesLoading } = useParties();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: allVehicles, isLoading: vehiclesLoading } = useVehicles();
  const createTrip = useCreateTrip();

  const [date, setDate] = useState(new Date());
  const [partyId, setPartyId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [freightParty, setFreightParty] = useState('');
  const [freightSupplier, setFreightSupplier] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter vehicles based on selected supplier
  const filteredVehicles = useMemo(() => {
    if (!supplierId || !allVehicles) return [];
    return allVehicles.filter(v => v.supplier_id === supplierId);
  }, [supplierId, allVehicles]);

  // Reset vehicle when supplier changes
  const handleSupplierChange = (value: string) => {
    setSupplierId(value);
    setVehicleId(null);
  };

  const partyOptions = useMemo(() => {
    if (!parties) return [];
    return parties.map(p => ({ label: p.name, value: p.id }));
  }, [parties]);

  const supplierOptions = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.map(s => ({ label: s.name, value: s.id }));
  }, [suppliers]);

  const vehicleOptions = useMemo(() => {
    return filteredVehicles.map(v => ({ label: v.vehicle_no, value: v.id }));
  }, [filteredVehicles]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!partyId) newErrors.partyId = 'Please select a party';
    if (!vehicleId) newErrors.vehicleId = 'Please select a vehicle';
    if (!origin.trim()) newErrors.origin = 'Origin is required';
    if (!destination.trim()) newErrors.destination = 'Destination is required';
    if (!freightParty || isNaN(Number(freightParty))) {
      newErrors.freightParty = 'Valid freight amount is required';
    }
    if (!freightSupplier || isNaN(Number(freightSupplier))) {
      newErrors.freightSupplier = 'Valid freight amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      const trip = await createTrip.mutateAsync({
        date: date.toISOString().split('T')[0],
        party_id: partyId!,
        vehicle_id: vehicleId!,
        origin: origin.trim(),
        destination: destination.trim(),
        freight_party: Number(freightParty),
        freight_supplier: Number(freightSupplier),
        lr_number: lrNumber.trim() || null,
        material_desc: materialDesc.trim() || null,
        notes: notes.trim() || null,
      });
      
      // Navigate to the created trip
      router.replace(`/trips/${trip.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create trip');
    }
  };

  if (partiesLoading || suppliersLoading || vehiclesLoading) {
    return <Loading message="Loading data..." />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Create Trip' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <DatePicker
          label="Trip Date *"
          value={date}
          onChange={setDate}
        />

        <Select
          label="Party Account *"
          placeholder="Select a party"
          options={partyOptions}
          value={partyId}
          onChange={setPartyId}
          error={errors.partyId}
        />

        {parties?.length === 0 && (
          <Text style={styles.warningText}>
            No parties available. Please create a party first.
          </Text>
        )}

        <Select
          label="Supplier Account *"
          placeholder="Select a supplier"
          options={supplierOptions}
          value={supplierId}
          onChange={handleSupplierChange}
        />

        <Select
          label="Vehicle *"
          placeholder={supplierId ? "Select a vehicle" : "Select supplier first"}
          options={vehicleOptions}
          value={vehicleId}
          onChange={setVehicleId}
          error={errors.vehicleId}
        />

        {supplierId && filteredVehicles.length === 0 && (
          <Text style={styles.warningText}>
            No vehicles for this supplier. Add vehicles to the supplier first.
          </Text>
        )}

        <View style={styles.row}>
          <TextInput
            label="Origin *"
            placeholder="From"
            value={origin}
            onChangeText={setOrigin}
            error={errors.origin}
            containerStyle={styles.halfInput}
          />
          <TextInput
            label="Destination *"
            placeholder="To"
            value={destination}
            onChangeText={setDestination}
            error={errors.destination}
            containerStyle={styles.halfInput}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Freight (PA) *"
            placeholder="₹ Amount"
            value={freightParty}
            onChangeText={setFreightParty}
            keyboardType="numeric"
            error={errors.freightParty}
            containerStyle={styles.halfInput}
          />
          <TextInput
            label="Freight (SA) *"
            placeholder="₹ Amount"
            value={freightSupplier}
            onChangeText={setFreightSupplier}
            keyboardType="numeric"
            error={errors.freightSupplier}
            containerStyle={styles.halfInput}
          />
        </View>

        <TextInput
          label="LR Number"
          placeholder="Loading receipt number"
          value={lrNumber}
          onChangeText={setLrNumber}
        />

        <TextInput
          label="Material Description"
          placeholder="Describe the material"
          value={materialDesc}
          onChangeText={setMaterialDesc}
          multiline
          numberOfLines={2}
        />

        <TextInput
          label="Notes"
          placeholder="Additional notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title="Create Trip"
            onPress={handleCreate}
            loading={createTrip.isPending}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  warningText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
