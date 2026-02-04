import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useParty, useUpdateParty } from '../../../src/hooks';
import { Button, TextInput, Loading } from '../../../src/components';
import { Colors, Spacing } from '../../../src/constants/theme';

export default function EditPartyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: party, isLoading } = useParty(id);
  const updateParty = useUpdateParty();

  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [podAddress, setPodAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (party) {
      setName(party.name);
      setContactNo(party.contact_no || '');
      setPodAddress(party.pod_address || '');
    }
  }, [party]);

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Party name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      await updateParty.mutateAsync({
        id,
        data: {
          name: name.trim(),
          contact_no: contactNo.trim() || null,
          pod_address: podAddress.trim() || null,
        },
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update party');
    }
  };

  if (isLoading) {
    return <Loading message="Loading party..." />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Party' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Party Name *"
          placeholder="Enter party name"
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
            title="Save Changes"
            onPress={handleUpdate}
            loading={updateParty.isPending}
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
