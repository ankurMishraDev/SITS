import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSupplier, useUpdateSupplier } from '../../../src/hooks';
import { Button, TextInput, Loading } from '../../../src/components';
import { Colors, Spacing } from '../../../src/constants/theme';

export default function EditSupplierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: supplier, isLoading } = useSupplier(id);
  const updateSupplier = useUpdateSupplier();

  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactNo(supplier.contact_no || '');
    }
  }, [supplier]);

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      await updateSupplier.mutateAsync({
        id,
        data: {
          name: name.trim(),
          contact_no: contactNo.trim() || null,
        },
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update supplier');
    }
  };

  if (isLoading) {
    return <Loading message="Loading supplier..." />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Supplier' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Supplier Name *"
          placeholder="Enter supplier name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <TextInput
          label="Contact Number"
          placeholder="Enter contact number"
          value={contactNo}
          onChangeText={setContactNo}
          keyboardType="phone-pad"
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title="Save Changes"
            onPress={handleUpdate}
            loading={updateSupplier.isPending}
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
