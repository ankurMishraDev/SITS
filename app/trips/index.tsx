import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Alert, Text } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useDeleteTrip } from '../../src/hooks';
import { Button, ListItem, Loading, EmptyState } from '../../src/components';
import { TripFilterBar, TripFilters, TripFilterModal } from '../../src/components/trip';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';

export default function TripsScreen() {
  const router = useRouter();
  const { data: trips, isLoading } = useTrips();
  const deleteTrip = useDeleteTrip();

  const [filters, setFilters] = useState<TripFilters>({});
  const [activeFilterKey, setActiveFilterKey] = useState<keyof TripFilters | null>(null);

  // Filter trips based on active filters
  const filteredTrips = useMemo(() => {
    if (!trips) return [];

    return trips.filter(trip => {
      if (filters.partyId && trip.party_id !== filters.partyId) return false;
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
  }, [trips, filters]);

  const handleFilterPress = (filterKey: keyof TripFilters) => {
    setActiveFilterKey(filterKey);
  };

  const handleFilterApply = (value: any) => {
    setFilters(prev => ({ ...prev, [activeFilterKey!]: value }));
    setActiveFilterKey(null);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleDelete = (id: string, partyName: string) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete this trip for "${partyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTrip.mutate(id),
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

  if (isLoading) {
    return <Loading message="Loading trips..." />;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Trips',
          headerRight: () => (
            <Ionicons 
              name="add-circle" 
              size={28} 
              color={Colors.primary}
              onPress={() => router.push('/trips/create')}
            />
          ),
        }} 
      />
      <View style={styles.container}>
        <TripFilterBar
          filters={filters}
          onFilterPress={handleFilterPress}
          onClearFilters={handleClearFilters}
        />
        
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
                    <Text style={styles.freightLabel}>Party F</Text>
                    <Text style={styles.freightValue}>₹{item.freight_party.toLocaleString()}</Text>
                  </View>
                  <View style={styles.freightItem}>
                    <Text style={styles.freightLabel}>Supplier F</Text>
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
                      onPress={() => handleDelete(item.id, item.party.name)}
                    />
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            title="No Trips Yet"
            message="Create your first trip to get started"
            icon={<Ionicons name="car-outline" size={64} color={Colors.textLight} />}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Create New Trip"
            onPress={() => router.push('/trips/create')}
            icon={<Ionicons name="add" size={20} color={Colors.textInverse} />}
          />
        </View>

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
  buttonContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
