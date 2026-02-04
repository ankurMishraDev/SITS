import React from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useParties, useDeleteParty } from '../../src/hooks';
import { Button, ListItem, Loading, EmptyState } from '../../src/components';
import { Colors, Spacing } from '../../src/constants/theme';

export default function PartiesScreen() {
  const router = useRouter();
  const { data: parties, isLoading, error } = useParties();
  const deleteParty = useDeleteParty();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Party',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteParty.mutate(id),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading message="Loading parties..." />;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Party Accounts',
          headerRight: () => (
            <Ionicons 
              name="add-circle" 
              size={28} 
              color={Colors.primary}
              onPress={() => router.push('/parties/create')}
            />
          ),
        }} 
      />
      <View style={styles.container}>
        {parties && parties.length > 0 ? (
          <FlatList
            data={parties}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ListItem
                title={item.name}
                subtitle={item.contact_no || 'No contact'}
                accentColor={Colors.partyColor}
                onPress={() => router.push(`/parties/${item.id}`)}
                onEdit={() => router.push(`/parties/${item.id}/edit`)}
                onDelete={() => handleDelete(item.id, item.name)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            title="No Parties Yet"
            message="Add your first party account to get started"
            icon={<Ionicons name="people-outline" size={64} color={Colors.textLight} />}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Add New Party"
            onPress={() => router.push('/parties/create')}
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
