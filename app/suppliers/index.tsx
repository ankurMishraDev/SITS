import React from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSuppliers, useDeleteSupplier, useVehicles } from '../../src/hooks';
import { Button, ListItem, Loading, EmptyState } from '../../src/components';
import { Colors, Spacing } from '../../src/constants/theme';

export default function SuppliersScreen() {
  const router = useRouter();
  const { data: suppliers, isLoading } = useSuppliers();
  const { data: vehicles } = useVehicles();
  const deleteSupplier = useDeleteSupplier();

  const getVehicleCount = (supplierId: string) => {
    if (!vehicles) return 0;
    return vehicles.filter(v => v.supplier_id === supplierId).length;
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${name}"? This will also delete all associated vehicles.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSupplier.mutate(id),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading message="Loading suppliers..." />;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Supplier Accounts',
          headerRight: () => (
            <Ionicons 
              name="add-circle" 
              size={28} 
              color={Colors.primary}
              onPress={() => router.push('/suppliers/create')}
            />
          ),
        }} 
      />
      <View style={styles.container}>
        {suppliers && suppliers.length > 0 ? (
          <FlatList
            data={suppliers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ListItem
                title={item.name}
                subtitle={item.contact_no || 'No contact'}
                rightText={`${getVehicleCount(item.id)}`}
                rightSubtext="vehicles"
                accentColor={Colors.supplierColor}
                onPress={() => router.push(`/suppliers/${item.id}`)}
                onEdit={() => router.push(`/suppliers/${item.id}/edit`)}
                onDelete={() => handleDelete(item.id, item.name)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            title="No Suppliers Yet"
            message="Add your first supplier account to get started"
            icon={<Ionicons name="business-outline" size={64} color={Colors.textLight} />}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Add New Supplier"
            onPress={() => router.push('/suppliers/create')}
            icon={<Ionicons name="add" size={20} color={Colors.textInverse} />}
          />
        </View>
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
  buttonContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
