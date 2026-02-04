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
            <Ionicons name="people" size={48} color={Colors.textInverse} />
            <Text style={styles.buttonText}>PA</Text>
            <Text style={styles.buttonSubtext}>Party Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.tripColor }]}
            onPress={() => router.push('/trips')}
            activeOpacity={0.8}
          >
            <Ionicons name="car" size={48} color={Colors.textInverse} />
            <Text style={styles.buttonText}>T</Text>
            <Text style={styles.buttonSubtext}>Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.supplierColor }]}
            onPress={() => router.push('/suppliers')}
            activeOpacity={0.8}
          >
            <Ionicons name="business" size={48} color={Colors.textInverse} />
            <Text style={styles.buttonText}>SA</Text>
            <Text style={styles.buttonSubtext}>Supplier Accounts</Text>
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
    marginBottom: Spacing.xxl,
  },
  buttonsContainer: {
    gap: Spacing.lg,
  },
  mainButton: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginTop: Spacing.sm,
  },
  buttonSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
});
