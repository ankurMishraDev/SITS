import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'SITS', 
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <Text style={styles.title}>Commission Business Tally</Text>
        <Text style={styles.subtitle}>Select an option to continue</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.partyColor }]}
            onPress={() => router.push('/parties')}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={34} color={Colors.textInverse} />
            <Text style={styles.buttonText}>PA</Text>
            <Text style={styles.buttonSubtext}>Party Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.tripColor }]}
            onPress={() => router.push('/trips')}
            activeOpacity={0.8}
          >
            <Ionicons name="car" size={34} color={Colors.textInverse} />
            <Text style={styles.buttonText}>T</Text>
            <Text style={styles.buttonSubtext}>Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.supplierColor }]}
            onPress={() => router.push('/suppliers')}
            activeOpacity={0.8}
          >
            <Ionicons name="business" size={34} color={Colors.textInverse} />
            <Text style={styles.buttonText}>SA</Text>
            <Text style={styles.buttonSubtext}>Supplier Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.loadingSlipColor }]}
            onPress={() => router.push('/loading-slips')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text" size={34} color={Colors.textInverse} />
            <Text style={styles.buttonText}>LP</Text>
            <Text style={styles.buttonSubtext}>Loading Slips</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  mainButton: {
    width: '47%',
    padding: Spacing.lg * 0.7,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    aspectRatio: 1,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FontSize.xl * 0.7,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginTop: Spacing.xs,
  },
  buttonSubtext: {
    fontSize: FontSize.xs * 0.9,
    color: Colors.textInverse,
    opacity: 0.9,
    marginTop: Spacing.xs * 0.5,
  },
});
