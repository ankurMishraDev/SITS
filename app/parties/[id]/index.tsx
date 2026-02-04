import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useParty } from '../../../src/hooks/useParties';
import { useTrips, useDeleteTrip } from '../../../src/hooks/useTrips';
import { Loading, EmptyState, Button } from '../../../src/components';
import { TripFilterBar, TripFilterModal, TripFilters } from '../../../src/components/trip';
import { Colors, Spacing, FontSize } from '../../../src/constants/theme';

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: party, isLoading: loadingParty } = useParty(id || '');
  const { data: allTrips, isLoading: loadingTrips } = useTrips();
  const deleteTrip = useDeleteTrip();

  const [filters, setFilters] = useState<Omit<TripFilters, 'partyId'>>({});
  const [activeFilterKey, setActiveFilterKey] = useState<keyof Omit<TripFilters, 'partyId'> | null>(null);

  // Filter trips for this party
  const partyTrips = useMemo(() => {
    if (!allTrips || !id) return [];
    return allTrips.filter((trip: any) => trip.party_id === id);
  }, [allTrips, id]);

  // Apply filters
  const filteredTrips = useMemo(() => {
    return partyTrips.filter((trip: any) => {
      if (filters.vehicleId && trip.vehicle_id !== filters.vehicleId) return false;
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
  }, [partyTrips, filters]);

  // Calculate total pending balance
  const totalPendingBalance = useMemo(() => {
    return filteredTrips.reduce((sum: number, trip: any) => {
      if (trip.status !== 'settled') {
        return sum + (trip.freight_party || 0);
      }
      return sum;
    }, 0);
  }, [filteredTrips]);

  const handleFilterPress = (filterKey: keyof Omit<TripFilters, 'partyId'>) => {
    setActiveFilterKey(filterKey);
  };

  const handleFilterApply = (value: any) => {
    setFilters(prev => ({ ...prev, [activeFilterKey!]: value }));
    setActiveFilterKey(null);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleDelete = (tripId: string, vehicleNo: string) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete this trip for vehicle "${vehicleNo}"?`,
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

  if (loadingParty || loadingTrips) {
    return <Loading message="Loading party details..." />;
  }

  if (!party) {
    return <EmptyState title="Party not found" message="This party does not exist" />;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: party.name,
          headerRight: () => (
            <Ionicons 
              name="add-circle" 
              size={28} 
              color={Colors.primary}
              onPress={() => router.push({ pathname: '/trips/create', params: { partyId: id } })}
            />
          ),
        }} 
      />
      <View style={styles.container}>
        {/* Party Info Card */}
        <View style={styles.partyCard}>
          <View style={styles.partyHeader}>
            <Text style={styles.partyName}>{party.name}</Text>
            <View style={styles.partyBadge}>
              <Ionicons name="briefcase" size={16} color={Colors.primary} />
              <Text style={styles.partyBadgeText}>Party</Text>
            </View>
          </View>
          
          <View style={styles.partyStats}>
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
          excludeFilters={['partyId']}
        />

        {/* Trips List */}
        {filteredTrips && filteredTrips.length > 0 ? (
          <FlatList
            data={filteredTrips}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDate}>{formatDate(item.date)}</Text>
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
                      onPress={() => handleDelete(item.id, item.vehicle.vehicle_no)}
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
              : "No trips for this party yet"}
            icon={<Ionicons name="car-outline" size={64} color={Colors.textLight} />}
          />
        )}

        <TripFilterModal
          visible={activeFilterKey !== null}
          filterKey={activeFilterKey || 'vehicleId'}
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
  partyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.partyColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  partyName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  partyBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  partyStats: {
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
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tripDate: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
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
});
