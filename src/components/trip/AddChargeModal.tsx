import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../Button';
import { TextInput } from '../TextInput';
import { Select } from '../Select';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { CHARGE_OPERATIONS } from '../../constants/options';
import { useChargeTypes, useCreateCharge, useCreateChargeType } from '../../hooks';
import { TransactionSide, ChargeOperation } from '../../types';

interface AddChargeModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  side: TransactionSide;
}

export function AddChargeModal({ visible, onClose, tripId, side }: AddChargeModalProps) {
  const { data: chargeTypes } = useChargeTypes();
  const createCharge = useCreateCharge();
  const createChargeType = useCreateChargeType();

  const [operation, setOperation] = useState<string | null>(null);
  const [chargeTypeId, setChargeTypeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showNewChargeType, setShowNewChargeType] = useState(false);
  const [newChargeTypeName, setNewChargeTypeName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const chargeTypeOptions = useMemo(() => {
    if (!chargeTypes) return [];
    return chargeTypes.map(ct => ({ label: ct.name, value: ct.id }));
  }, [chargeTypes]);

  const resetForm = () => {
    setOperation(null);
    setChargeTypeId(null);
    setAmount('');
    setNotes('');
    setShowNewChargeType(false);
    setNewChargeTypeName('');
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!operation) {
      newErrors.operation = 'Operation type is required';
    }
    if (!chargeTypeId && !showNewChargeType) {
      newErrors.chargeTypeId = 'Charge type is required';
    }
    if (showNewChargeType && !newChargeTypeName.trim()) {
      newErrors.newChargeTypeName = 'Charge type name is required';
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      let typeId = chargeTypeId;

      // Create new charge type if needed
      if (showNewChargeType) {
        const newType = await createChargeType.mutateAsync({
          name: newChargeTypeName.trim(),
          is_custom: true,
        });
        typeId = newType.id;
      }

      await createCharge.mutateAsync({
        trip_id: tripId,
        side,
        charge_type_id: typeId!,
        operation: operation as ChargeOperation,
        amount: Number(amount),
        notes: notes.trim() || null,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add charge');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add Charge ({side === 'party' ? 'Party' : 'Supplier'})</Text>

          <Select
            label="Operation *"
            placeholder="Select operation"
            options={CHARGE_OPERATIONS.map(o => ({ label: o.label, value: o.value }))}
            value={operation}
            onChange={setOperation}
            error={errors.operation}
          />

          {!showNewChargeType ? (
            <View>
              <Select
                label="Charge Type *"
                placeholder="Select charge type"
                options={chargeTypeOptions}
                value={chargeTypeId}
                onChange={setChargeTypeId}
                error={errors.chargeTypeId}
              />
              <TouchableOpacity 
                style={styles.newTypeLink} 
                onPress={() => {
                  setShowNewChargeType(true);
                  setChargeTypeId(null);
                }}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.newTypeLinkText}>Create new charge type</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                label="New Charge Type *"
                placeholder="Enter charge type name"
                value={newChargeTypeName}
                onChangeText={setNewChargeTypeName}
                error={errors.newChargeTypeName}
              />
              <TouchableOpacity 
                style={styles.newTypeLink} 
                onPress={() => {
                  setShowNewChargeType(false);
                  setNewChargeTypeName('');
                }}
              >
                <Ionicons name="list" size={16} color={Colors.primary} />
                <Text style={styles.newTypeLinkText}>Select from existing types</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            label="Amount *"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={errors.amount}
          />

          <TextInput
            label="Notes"
            placeholder="Optional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              style={styles.cancelButton}
            />
            <Button
              title="Add Charge"
              onPress={handleSubmit}
              loading={createCharge.isPending || createChargeType.isPending}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  newTypeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  newTypeLinkText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
