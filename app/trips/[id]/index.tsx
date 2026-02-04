import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useTrip, 
  useTripBalances,
  useAdvances,
  useCharges,
  useBalancePayments,
  useUpdateTrip,
} from '../../../src/hooks';
import { 
  Loading, 
  Card, 
  Button,
  TransactionSection,
  AddAdvanceModal,
  AddChargeModal,
  AddBalanceModal,
  PodSection,
} from '../../../src/components';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { TransactionSide } from '../../../src/types';

type TabType = 'party' | 'supplier' | 'pod';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const { data: balances } = useTripBalances(id);
  const { data: partyAdvances } = useAdvances(id, 'party');
  const { data: supplierAdvances } = useAdvances(id, 'supplier');
  const { data: partyCharges } = useCharges(id, 'party');
  const { data: supplierCharges } = useCharges(id, 'supplier');
  const { data: partyPayments } = useBalancePayments(id, 'party');
  const { data: supplierPayments } = useBalancePayments(id, 'supplier');
  const updateTrip = useUpdateTrip();

  const [activeTab, setActiveTab] = useState<TabType>('party');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [modalSide, setModalSide] = useState<TransactionSide>('party');

  const handleOpenModal = (type: 'advance' | 'charge' | 'balance', side: TransactionSide) => {
    // Check POD restriction for supplier balance
    if (type === 'balance' && side === 'supplier' && !trip?.pod_uploaded) {
      Alert.alert(
        'POD Required',
        'You must upload the POD before adding balance payments for the supplier.',
        [{ text: 'OK' }]
      );
      return;
    }

    setModalSide(side);
    if (type === 'advance') setShowAdvanceModal(true);
    else if (type === 'charge') setShowChargeModal(true);
    else if (type === 'balance') setShowBalanceModal(true);
  };

  const handleTogglePod = async () => {
    if (!trip) return;
    
    try {
      await updateTrip.mutateAsync({
        id: trip.id,
        data: { 
          pod_uploaded: !trip.pod_uploaded,
          status: !trip.pod_uploaded ? 'pod_received' : 'open',
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update POD status');
    }
  };

  if (isLoading) {
    return <Loading message="Loading trip details..." />;
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'party' && styles.activeTab]}
        onPress={() => setActiveTab('party')}
      >
        <Text style={[styles.tabText, activeTab === 'party' && styles.activeTabText]}>Party</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'supplier' && styles.activeTab]}
        onPress={() => setActiveTab('supplier')}
      >
        <Text style={[styles.tabText, activeTab === 'supplier' && styles.activeTabText]}>Supplier</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pod' && styles.activeTab]}
        onPress={() => setActiveTab('pod')}
      >
        <Ionicons 
          name={trip.pod_uploaded ? 'checkmark-circle' : 'document'} 
          size={16} 
          color={activeTab === 'pod' ? Colors.primary : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'pod' && styles.activeTabText]}>POD</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPartySection = () => (
    <ScrollView style={styles.tabContent}>
      {/* Trip Info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Party:</Text>
          <Text style={styles.infoValue}>{trip.party.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(trip.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle:</Text>
          <Text style={styles.infoValue}>{trip.vehicle.vehicle_no}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Route:</Text>
          <Text style={styles.infoValue}>{trip.origin} → {trip.destination}</Text>
        </View>
        {trip.lr_number && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LR No:</Text>
            <Text style={styles.infoValue}>{trip.lr_number}</Text>
          </View>
        )}
        {trip.material_desc && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Material:</Text>
            <Text style={styles.infoValue}>{trip.material_desc}</Text>
          </View>
        )}
        {trip.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.infoValue}>{trip.notes}</Text>
          </View>
        )}
      </Card>

      {/* Financial Section */}
      <TransactionSection
        title="Freight Amount"
        amount={trip.freight_party}
        tripId={id}
        side="party"
        advances={partyAdvances || []}
        charges={partyCharges || []}
        balancePayments={partyPayments || []}
        balanceRemaining={balances?.party_balance_remaining || 0}
        onAddAdvance={() => handleOpenModal('advance', 'party')}
        onAddCharge={() => handleOpenModal('charge', 'party')}
        onAddBalance={() => handleOpenModal('balance', 'party')}
      />
    </ScrollView>
  );

  const renderSupplierSection = () => (
    <ScrollView style={styles.tabContent}>
      {/* Trip Info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Supplier:</Text>
          <Text style={styles.infoValue}>{trip.vehicle.supplier.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(trip.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle:</Text>
          <Text style={styles.infoValue}>{trip.vehicle.vehicle_no}</Text>
        </View>
        {trip.lr_number && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LR No:</Text>
            <Text style={styles.infoValue}>{trip.lr_number}</Text>
          </View>
        )}
        {trip.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.infoValue}>{trip.notes}</Text>
          </View>
        )}
      </Card>

      {/* Financial Section */}
      <TransactionSection
        title="Freight Amount"
        amount={trip.freight_supplier}
        tripId={id}
        side="supplier"
        advances={supplierAdvances || []}
        charges={supplierCharges || []}
        balancePayments={supplierPayments || []}
        balanceRemaining={balances?.supplier_balance_remaining || 0}
        onAddAdvance={() => handleOpenModal('advance', 'supplier')}
        onAddCharge={() => handleOpenModal('charge', 'supplier')}
        onAddBalance={() => handleOpenModal('balance', 'supplier')}
        podRequired={!trip.pod_uploaded}
      />
    </ScrollView>
  );

  const renderPodSection = () => (
    <ScrollView style={styles.tabContent}>
      <PodSection trip={trip} />
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Trip - ${trip.party.name}`,
        }} 
      />
      <View style={styles.container}>
        {renderTabs()}
        
        {activeTab === 'party' && renderPartySection()}
        {activeTab === 'supplier' && renderSupplierSection()}
        {activeTab === 'pod' && renderPodSection()}

        <AddAdvanceModal
          visible={showAdvanceModal}
          onClose={() => setShowAdvanceModal(false)}
          tripId={id}
          side={modalSide}
        />

        <AddChargeModal
          visible={showChargeModal}
          onClose={() => setShowChargeModal(false)}
          tripId={id}
          side={modalSide}
        />

        <AddBalanceModal
          visible={showBalanceModal}
          onClose={() => setShowBalanceModal(false)}
          tripId={id}
          side={modalSide}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  infoCard: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  podCard: {
    margin: Spacing.md,
    alignItems: 'center',
  },
  podStatus: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  podStatusText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  podDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  podNote: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },
});
