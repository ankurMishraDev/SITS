import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSupplier, useVehicles, useCreateVehicle, useDeleteVehicle, useTrips, useDeleteTrip } from '../../../src/hooks';
import { Button, Card, Loading, TextInput, EmptyState } from '../../../src/components';
import { TripFilterBar, TripFilterModal, TripFilters } from '../../../src/components/trip';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: supplier, isLoading: supplierLoading } = useSupplier(id);
  const { data: allVehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: allTrips, isLoading: tripsLoading } = useTrips();
  const createVehicle = useCreateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const deleteTrip = useDeleteTrip();

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleNo, setNewVehicleNo] = useState('');
  const [filters, setFilters] = useState<Omit<TripFilters, 'vehicleId'>>({});
  const [activeFilterKey, setActiveFilterKey] = useState<keyof Omit<TripFilters, 'vehicleId'> | null>(null);

  // Filter vehicles for this supplier
  const vehicles = allVehicles?.filter(v => v.supplier_id === id);

  // Get all vehicle IDs for this supplier
  const supplierVehicleIds = useMemo(() => {
    return vehicles?.map(v => v.id) || [];
  }, [vehicles]);

  // Filter trips for this supplier's vehicles
  const supplierTrips = useMemo(() => {
    if (!allTrips || supplierVehicleIds.length === 0) return [];
    return allTrips.filter((trip: any) => supplierVehicleIds.includes(trip.vehicle_id));
  }, [allTrips, supplierVehicleIds]);

  // Apply filters
  const filteredTrips = useMemo(() => {
    return supplierTrips.filter((trip: any) => {
      if (filters.partyId && trip.party_id !== filters.partyId) return false;
      if (filters.lrNo && !trip.lr_number?.toLowerCase().includes(filters.lrNo.toLowerCase())) return false;
      if (filters.date) {
        const tripDate = new Date(trip.date).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        if (tripDate !== filterDate) return false;
      }
      if (filters.month) {
        const tripMonth = new Date(trip.date).toISOString().slice(0, 7);
        if (tripMonth !== filters.month) return false;
      }
      if (filters.podStatus) {
        const hasPod = trip.pod_uploaded;
        if (filters.podStatus === 'uploaded' && !hasPod) return false;
        if (filters.podStatus === 'not_uploaded' && hasPod) return false;
      }
      if (filters.originPlace && !trip.origin.toLowerCase().includes(filters.originPlace.toLowerCase())) return false;
      if (filters.destinationPlace && !trip.destination.toLowerCase().includes(filters.destinationPlace.toLowerCase())) return false;
      
      return true;
    });
  }, [supplierTrips, filters]);

  // Calculate total pending balance (supplier freight)
  const totalPendingBalance = useMemo(() => {
    return filteredTrips.reduce((sum: number, trip: any) => {
      if (trip.status !== 'settled') {
        return sum + (trip.freight_supplier || 0);
      }
      return sum;
    }, 0);
  }, [filteredTrips]);

  const handleFilterPress = (filterKey: keyof Omit<TripFilters, 'vehicleId'>) => {
    setActiveFilterKey(filterKey);
  };

  const handleFilterApply = (value: any) => {
    setFilters(prev => ({ ...prev, [activeFilterKey!]: value }));
    setActiveFilterKey(null);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleAddVehicle = async () => {
    if (!newVehicleNo.trim()) return;

    try {
      await createVehicle.mutateAsync({
        supplier_id: id,
        vehicle_no: newVehicleNo.trim().toUpperCase(),
      });
      setNewVehicleNo('');
      setShowAddVehicle(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = (vehicleId: string, vehicleNo: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete vehicle "${vehicleNo}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVehicle.mutate(vehicleId),
        },
      ]
    );
  };

  const handleDeleteTrip = (tripId: string, partyName: string) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete this trip for party "${partyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTrip.mutate(tripId),
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.warning;
      case 'pod_received': return Colors.primary;
      case 'settled': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  if (supplierLoading || tripsLoading) {
    return <Loading message="Loading supplier details..." />;
  }

  if (!supplier) {
    return <EmptyState title="Supplier not found" message="This supplier does not exist" />;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: supplier.name,
          headerRight: () => (
            <Ionicons 
              name="pencil" 
              size={24} 
              color={Colors.primary}
              onPress={() => router.push(`/suppliers/${id}/edit`)}
            />
          ),
        }} 
      />
      <View style={styles.container}>
        {/* Supplier Info Card */}
        <View style={styles.supplierCard}>
          <View style={styles.supplierHeader}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <View style={styles.supplierBadge}>
              <Ionicons name="people" size={16} color={Colors.supplierColor} />
              <Text style={styles.supplierBadgeText}>Supplier</Text>
            </View>
          </View>
          
          <View style={styles.supplierStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Vehicles</Text>
              <Text style={styles.statValue}>{vehicles?.length || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Trips</Text>
              <Text style={styles.statValue}>{filteredTrips.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending Balance</Text>
              <Text style={[styles.statValue, styles.balanceValue]}>
                ₹{totalPendingBalance.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <TripFilterBar
          filters={filters as TripFilters}
          onFilterPress={handleFilterPress as any}
          onClearFilters={handleClearFilters}
          excludeFilters={['vehicleId']}
        />

        {/* Trips List */}
        {filteredTrips && filteredTrips.length > 0 ? (
          <FlatList
            data={filteredTrips}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View style={styles.tripInfo}>
                    <Text style={styles.partyName}>{item.party.name}</Text>
                    <Text style={styles.tripDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                <View style={styles.routeContainer}>
                  <Text style={styles.routeText}>{item.origin}</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
                  <Text style={styles.routeText}>{item.destination}</Text>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="car" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.vehicle.vehicle_no}</Text>
                  </View>
                  {item.lr_number && (
                    <View style={styles.detailItem}>
                      <Ionicons name="document-text" size={14} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>LR: {item.lr_number}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.freightContainer}>
                  <View style={styles.freightItem}>
                    <Text style={styles.freightLabel}>Party Freight</Text>
                    <Text style={styles.freightValue}>₹{item.freight_party.toLocaleString()}</Text>
                  </View>
                  <View style={styles.freightItem}>
                    <Text style={styles.freightLabel}>Supplier Freight</Text>
                    <Text style={styles.freightValue}>₹{item.freight_supplier.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.tripActions}>
                  <Button
                    title="View Details"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/trips/${item.id}`)}
                  />
                  <View style={styles.actionIcons}>
                    <Ionicons
                      name="trash"
                      size={20}
                      color={Colors.danger}
                      onPress={() => handleDeleteTrip(item.id, item.party.name)}
                    />
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            title="No Trips Found"
            message={filters && Object.keys(filters).length > 0 
              ? "No trips match the selected filters" 
              : "No trips for this supplier yet"}
            icon={<Ionicons name="car-outline" size={64} color={Colors.textLight} />}
          />
        )}

        <TripFilterModal
          visible={activeFilterKey !== null}
          filterKey={activeFilterKey || 'partyId'}
          currentValue={activeFilterKey ? filters[activeFilterKey] : undefined}
          onApply={handleFilterApply}
          onClose={() => setActiveFilterKey(null)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  supplierCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.supplierColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  supplierName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  supplierBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.supplierColor,
  },
  supplierStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  balanceValue: {
    color: Colors.warning,
  },
  listContent: {
    padding: Spacing.md,
  },
  tripCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tripColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tripInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  tripDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  routeText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  freightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  freightItem: {
    alignItems: 'center',
  },
  freightLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  freightValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tripInfoText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  loadingText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.md,
  },
  actions: {
    padding: Spacing.md,
  },
});
