import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useCreateParty } from '../../src/hooks';
import { Button, TextInput } from '../../src/components';
import { Colors, Spacing } from '../../src/constants/theme';

export default function CreatePartyScreen() {
  const router = useRouter();
  const createParty = useCreateParty();

  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [podAddress, setPodAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Party name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      await createParty.mutateAsync({
        name: name.trim(),
        contact_no: contactNo.trim() || null,
        pod_address: podAddress.trim() || null,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create party');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Create Party' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Party Name *"
          placeholder="Enter party name"
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

        <TextInput
          label="POD Address"
          placeholder="Enter POD delivery address"
          value={podAddress}
          onChangeText={setPodAddress}
          multiline
          numberOfLines={3}
          style={styles.multilineInput}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title="Create Party"
            onPress={handleCreate}
            loading={createParty.isPending}
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
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
