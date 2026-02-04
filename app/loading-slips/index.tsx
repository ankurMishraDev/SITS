import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useLoadingSlips, useDeleteLoadingSlip } from '../../src/hooks/useLoadingSlips';
import { Card, EmptyState, Loading } from '../../src/components';

export default function LoadingSlipsScreen() {
  const router = useRouter();
  const { data: loadingSlips, loading, refetch } = useLoadingSlips();
  const { deleteLoadingSlip } = useDeleteLoadingSlip();

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const handleDelete = async (id: string, lrNo: string) => {
    Alert.alert(
      'Delete Loading Slip',
      `Are you sure you want to delete loading slip ${lrNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLoadingSlip(id);
              refetch();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete loading slip');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Loading Slips',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/loading-slips/create')}
              style={styles.headerButton}
            >
              <Ionicons name="add-circle" size={28} color={Colors.loadingSlipColor} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={loadingSlips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.slipCard}>
              <View style={styles.slipHeader}>
                <View style={styles.slipInfo}>
                  <View style={styles.lrContainer}>
                    <Ionicons name="document-text" size={20} color={Colors.loadingSlipColor} />
                    <Text style={styles.lrNo}>LR: {item.lr_no}</Text>
                  </View>
                  <Text style={styles.partyName}>{item.party?.name || 'N/A'}</Text>
                  <Text style={styles.slipDate}>{formatDate(item.trip_date)}</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={styles.routeText}>
                  {item.origin_place} → {item.destination_place}
                </Text>
              </View>

              <View style={styles.slipDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="car" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{item.vehicle_no}</Text>
                </View>
                {item.material_description && (
                  <View style={styles.detailItem}>
                    <Ionicons name="cube" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {item.material_description}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.amountContainer}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Freight</Text>
                  <Text style={styles.amountValue}>{formatCurrency(item.freight_amount)}</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Advance</Text>
                  <Text style={styles.amountValue}>{formatCurrency(item.advance_amount)}</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, styles.balanceValue]}>
                    {formatCurrency(item.freight_amount - item.advance_amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.slipActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/loading-slips/${item.id}`)}
                >
                  <Ionicons name="eye" size={20} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>View PDF</Text>
                </TouchableOpacity>
                
                <View style={styles.actionIcons}>
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/loading-slips/edit',
                      params: { id: item.id }
                    })}
                  >
                    <Ionicons name="pencil" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.lr_no)}>
                    <Ionicons name="trash" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="document-text-outline" size={64} color={Colors.textLight} />}
              title="No Loading Slips"
              message="Create your first loading slip to get started"
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginRight: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
  },
  slipCard: {
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.loadingSlipColor,
  },
  slipHeader: {
    marginBottom: Spacing.sm,
  },
  slipInfo: {
    gap: 4,
  },
  lrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lrNo: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  partyName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  slipDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  routeText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  slipDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  amountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  balanceValue: {
    color: Colors.warning,
  },
  slipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
