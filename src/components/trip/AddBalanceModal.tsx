import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert } from 'react-native';
import { Button } from '../Button';
import { TextInput } from '../TextInput';
import { Select } from '../Select';
import { DatePicker } from '../DatePicker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { PAYMENT_MODES } from '../../constants/options';
import { useCreateBalancePayment } from '../../hooks';
import { TransactionSide, PaymentMode } from '../../types';

interface AddBalanceModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  side: TransactionSide;
}

export function AddBalanceModal({ visible, onClose, tripId, side }: AddBalanceModalProps) {
  const createBalancePayment = useCreateBalancePayment();

  const [amount, setAmount] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date());
  const [paymentMode, setPaymentMode] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setAmount('');
    setReceivedDate(new Date());
    setPaymentMode(null);
    setNotes('');
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!paymentMode) {
      newErrors.paymentMode = 'Payment mode is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await createBalancePayment.mutateAsync({
        trip_id: tripId,
        side,
        amount: Number(amount),
        received_date: receivedDate.toISOString().split('T')[0],
        payment_mode: paymentMode as PaymentMode,
        notes: notes.trim() || null,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add balance payment');
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
          <Text style={styles.title}>Add Balance Payment ({side === 'party' ? 'Party' : 'Supplier'})</Text>

          <TextInput
            label="Amount *"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={errors.amount}
          />

          <DatePicker
            label="Received Date *"
            value={receivedDate}
            onChange={setReceivedDate}
          />

          <Select
            label="Payment Mode *"
            placeholder="Select payment mode"
            options={PAYMENT_MODES.map(m => ({ label: m.label, value: m.value }))}
            value={paymentMode}
            onChange={setPaymentMode}
            error={errors.paymentMode}
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
              title="Add Payment"
              onPress={handleSubmit}
              loading={createBalancePayment.isPending}
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
