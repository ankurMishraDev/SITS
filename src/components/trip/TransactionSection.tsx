import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../Card';
import { Button } from '../Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Advance, BalancePayment, TransactionSide, PaymentMode } from '../../types';
import { useDeleteAdvance, useDeleteCharge, useDeleteBalancePayment } from '../../hooks';

interface ChargeWithType {
  id: string;
  trip_id: string;
  side: TransactionSide;
  charge_type_id: string;
  operation: 'add' | 'deduct';
  amount: number;
  notes: string | null;
  created_at: string;
  charge_type: {
    id: string;
    name: string;
    is_custom: boolean;
  };
}

interface TransactionSectionProps {
  title: string;
  amount: number;
  tripId: string;
  side: TransactionSide;
  advances: Advance[];
  charges: ChargeWithType[];
  balancePayments: BalancePayment[];
  balanceRemaining: number;
  onAddAdvance: () => void;
  onAddCharge: () => void;
  onAddBalance: () => void;
  podRequired?: boolean;
}

export function TransactionSection({
  title,
  amount,
  tripId,
  side,
  advances,
  charges,
  balancePayments,
  balanceRemaining,
  onAddAdvance,
  onAddCharge,
  onAddBalance,
  podRequired = false,
}: TransactionSectionProps) {
  const deleteAdvance = useDeleteAdvance();
  const deleteCharge = useDeleteCharge();
  const deleteBalance = useDeleteBalancePayment();

  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const chargesAdd = charges.filter(c => c.operation === 'add').reduce((sum, c) => sum + c.amount, 0);
  const chargesDeduct = charges.filter(c => c.operation === 'deduct').reduce((sum, c) => sum + c.amount, 0);
  const totalBalancePaid = balancePayments.reduce((sum, b) => sum + b.amount, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatPaymentMode = (mode: PaymentMode) => {
    return mode;
  };

  const handleDeleteAdvance = (id: string) => {
    Alert.alert('Delete Advance', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAdvance.mutate({ id, tripId }) },
    ]);
  };

  const handleDeleteCharge = (id: string) => {
    Alert.alert('Delete Charge', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCharge.mutate({ id, tripId }) },
    ]);
  };

  const handleDeleteBalance = (id: string) => {
    Alert.alert('Delete Balance Payment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBalance.mutate({ id, tripId }) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Freight Amount */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.amountLarge}>₹{amount.toLocaleString()}</Text>
        </View>
      </Card>

      {/* Advances */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Advances (Adv)</Text>
          <TouchableOpacity onPress={onAddAdvance}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Received:</Text>
          <Text style={styles.summaryValue}>₹{totalAdvances.toLocaleString()}</Text>
        </View>

        {advances.length > 0 && (
          <View style={styles.itemsList}>
            {advances.map((adv) => (
              <View key={adv.id} style={styles.transactionItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemAmount}>₹{adv.amount.toLocaleString()}</Text>
                  <Text style={styles.itemDetails}>
                    {formatDate(adv.received_date)} • {formatPaymentMode(adv.payment_mode)}
                  </Text>
                  {adv.notes && <Text style={styles.itemNotes}>{adv.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteAdvance(adv.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Charges */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Charges</Text>
          <TouchableOpacity onPress={onAddCharge}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.chargesSummary}>
          <View style={styles.chargeSummaryItem}>
            <Text style={[styles.chargeLabel, { color: Colors.success }]}>+ Add:</Text>
            <Text style={styles.chargeValue}>₹{chargesAdd.toLocaleString()}</Text>
          </View>
          <View style={styles.chargeSummaryItem}>
            <Text style={[styles.chargeLabel, { color: Colors.danger }]}>- Deduct:</Text>
            <Text style={styles.chargeValue}>₹{chargesDeduct.toLocaleString()}</Text>
          </View>
        </View>

        {charges.length > 0 && (
          <View style={styles.itemsList}>
            {charges.map((charge) => (
              <View key={charge.id} style={styles.transactionItem}>
                <View style={styles.itemInfo}>
                  <View style={styles.chargeHeader}>
                    <Text style={[
                      styles.chargeOperation,
                      { color: charge.operation === 'add' ? Colors.success : Colors.danger }
                    ]}>
                      {charge.operation === 'add' ? '+' : '-'} ₹{charge.amount.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.itemDetails}>{charge.charge_type.name}</Text>
                  {charge.notes && <Text style={styles.itemNotes}>{charge.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteCharge(charge.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Balance */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Balance (Bal)</Text>
          <TouchableOpacity 
            onPress={onAddBalance}
            disabled={podRequired}
            style={podRequired ? styles.disabledButton : undefined}
          >
            <Ionicons 
              name="add-circle" 
              size={24} 
              color={podRequired ? Colors.textLight : Colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {podRequired && (
          <View style={styles.podWarning}>
            <Ionicons name="warning" size={16} color={Colors.warning} />
            <Text style={styles.podWarningText}>Upload POD to add balance payments</Text>
          </View>
        )}

        <View style={styles.balanceSummary}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Freight:</Text>
            <Text style={styles.balanceValue}>₹{amount.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>+ Charges:</Text>
            <Text style={styles.balanceValue}>₹{chargesAdd.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>- Charges:</Text>
            <Text style={styles.balanceValue}>₹{chargesDeduct.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>- Advances:</Text>
            <Text style={styles.balanceValue}>₹{totalAdvances.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>- Paid:</Text>
            <Text style={styles.balanceValue}>₹{totalBalancePaid.toLocaleString()}</Text>
          </View>
          <View style={[styles.balanceRow, styles.remainingRow]}>
            <Text style={styles.remainingLabel}>Remaining:</Text>
            <Text style={[
              styles.remainingValue,
              { color: balanceRemaining > 0 ? Colors.danger : Colors.success }
            ]}>
              ₹{balanceRemaining.toLocaleString()}
            </Text>
          </View>
        </View>

        {balancePayments.length > 0 && (
          <View style={styles.itemsList}>
            <Text style={styles.paymentsTitle}>Payments Received:</Text>
            {balancePayments.map((payment) => (
              <View key={payment.id} style={styles.transactionItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemAmount}>₹{payment.amount.toLocaleString()}</Text>
                  <Text style={styles.itemDetails}>
                    {formatDate(payment.received_date)} • {formatPaymentMode(payment.payment_mode)}
                  </Text>
                  {payment.notes && <Text style={styles.itemNotes}>{payment.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteBalance(payment.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  card: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  amountLarge: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  itemsList: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemAmount: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  itemDetails: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemNotes: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  chargesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  chargeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chargeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  chargeValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  chargeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chargeOperation: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  podWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  podWarningText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
  },
  balanceSummary: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  remainingRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  remainingLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  remainingValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  paymentsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
