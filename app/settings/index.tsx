import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleDrive } from '../../src/contexts';
import { Button, Card } from '../../src/components';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function SettingsScreen() {
  const { isAuthenticated, isLoading, signIn, signOut, rootFolderId, getFolderLink } = useGoogleDrive();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect to Google Drive');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Disconnect Google Drive',
      'Are you sure you want to disconnect from Google Drive? You won\'t be able to upload POD images until you reconnect.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const openDriveFolder = () => {
    if (rootFolderId && rootFolderId !== 'YOUR_ROOT_FOLDER_ID') {
      Linking.openURL(getFolderLink(rootFolderId));
    } else {
      Alert.alert('Not Configured', 'Please configure the root folder ID in the app settings.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Google Drive Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="logo-google" size={24} color={Colors.primary} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Google Drive</Text>
              <Text style={styles.sectionSubtitle}>
                {isAuthenticated ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            {isAuthenticated && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
            )}
          </View>

          <Text style={styles.description}>
            Connect your Google Drive to store POD (Proof of Delivery) images. 
            Images will be organized in folders by Party and Trip.
          </Text>

          {isAuthenticated ? (
            <View style={styles.actions}>
              <Button
                title="Open Drive Folder"
                variant="outline"
                onPress={openDriveFolder}
                icon={<Ionicons name="folder-open" size={18} color={Colors.primary} />}
                style={styles.actionButton}
              />
              <Button
                title="Disconnect"
                variant="outline"
                onPress={handleSignOut}
                icon={<Ionicons name="log-out-outline" size={18} color={Colors.danger} />}
                style={styles.disconnectButton}
              />
            </View>
          ) : (
            <Button
              title="Connect Google Drive"
              onPress={handleSignIn}
              loading={isLoading}
              icon={<Ionicons name="link" size={18} color={Colors.textInverse} />}
            />
          )}
        </Card>

        {/* Info Section */}
        <Card style={styles.card}>
          <Text style={styles.infoTitle}>How it works</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.infoText}>
              When you create a new Party, a folder is created in Google Drive
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.infoText}>
              When you create a Trip, a subfolder is created inside the party folder (e.g., "3485_31-Jan")
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.infoText}>
              POD images you upload are stored in the trip folder and can be accessed from anywhere
            </Text>
          </View>
        </Card>

        {/* Setup Instructions */}
        {!isAuthenticated && (
          <Card style={styles.card}>
            <Text style={styles.infoTitle}>Setup Required</Text>
            <Text style={styles.setupText}>
              Before connecting, make sure:
            </Text>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.checkText}>
                You have a Google account
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.checkText}>
                Google Cloud project is configured (developer setup)
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.checkText}>
                Root folder "SITS_POD" is created in your Drive
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    marginLeft: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  disconnectButton: {
    flex: 1,
    borderColor: Colors.danger,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  setupText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  checkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
