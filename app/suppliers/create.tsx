import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useCreateSupplier, useCreateVehicle } from '../../src/hooks';
import { Button, TextInput } from '../../src/components';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateSupplierScreen() {
  const router = useRouter();
  const createSupplier = useCreateSupplier();
  const createVehicle = useCreateVehicle();

  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; vehicleNo?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; vehicleNo?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = () => {
    if (!vehicleNo.trim()) {
      setErrors(prev => ({ ...prev, vehicleNo: 'Vehicle number is required' }));
      return;
    }
    if (vehicles.includes(vehicleNo.trim().toUpperCase())) {
      setErrors(prev => ({ ...prev, vehicleNo: 'Vehicle already added' }));
      return;
    }
    setVehicles([...vehicles, vehicleNo.trim().toUpperCase()]);
    setVehicleNo('');
    setErrors(prev => ({ ...prev, vehicleNo: undefined }));
  };

  const handleRemoveVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      // Create supplier first
      const supplier = await createSupplier.mutateAsync({
        name: name.trim(),
        contact_no: contactNo.trim() || null,
      });

      // Create vehicles for the supplier
      for (const vehNo of vehicles) {
        await createVehicle.mutateAsync({
          supplier_id: supplier.id,
          vehicle_no: vehNo,
        });
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create supplier');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Create Supplier' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Supplier Name *"
          placeholder="Enter supplier name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoFocus
        />

        <TextInput
          label="Contact Number"
          placeholder="Enter contact number"
          value={contactNo}
          onChangeText={setContactNo}
          keyboardType="phone-pad"
        />

        <View style={styles.vehicleSection}>
          <Text style={styles.sectionTitle}>Vehicles</Text>
          
          <View style={styles.vehicleInputRow}>
            <View style={styles.vehicleInput}>
              <TextInput
                placeholder="Enter vehicle number"
                value={vehicleNo}
                onChangeText={setVehicleNo}
                error={errors.vehicleNo}
                autoCapitalize="characters"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <Button
              title="Add"
              onPress={handleAddVehicle}
              size="sm"
              style={styles.addVehicleButton}
            />
          </View>

          {vehicles.length > 0 && (
            <View style={styles.vehicleList}>
              {vehicles.map((veh, index) => (
                <View key={index} style={styles.vehicleTag}>
                  <Ionicons name="car" size={16} color={Colors.supplierColor} />
                  <Text style={styles.vehicleTagText}>{veh}</Text>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={Colors.danger}
                    onPress={() => handleRemoveVehicle(index)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title="Create Supplier"
            onPress={handleCreate}
            loading={createSupplier.isPending}
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
  vehicleSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  vehicleInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  vehicleInput: {
    flex: 1,
  },
  addVehicleButton: {
    marginTop: 0,
  },
  vehicleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  vehicleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.supplierColor,
    gap: Spacing.xs,
  },
  vehicleTagText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
