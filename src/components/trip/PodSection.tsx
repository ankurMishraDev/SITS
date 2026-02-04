import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DriveService } from '../../services/DriveService';
import { usePods, useCreatePod, useDeletePod, useUpdateTrip, useUpdateParty } from '../../hooks';
import { Button, Card } from '../../components';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { TripWithRelations } from '../../types';

interface PodSectionProps {
  trip: TripWithRelations;
}

export function PodSection({ trip }: PodSectionProps) {
  const { data: pods, isLoading: podsLoading } = usePods(trip.id);
  const createPod = useCreatePod();
  const deletePod = useDeletePod();
  const updateTrip = useUpdateTrip();
  const updateParty = useUpdateParty();

  const [uploading, setUploading] = useState(false);

  const ensureTripFolder = async (): Promise<string> => {
    // Create or get party folder
    let partyFolderId = trip.party.drive_folder_id;
    if (!partyFolderId) {
      const result = await DriveService.createPartyFolder(trip.party.name);
      partyFolderId = result.folderId;
      
      // Update party record with folder ID
      await updateParty.mutateAsync({
        id: trip.party.id,
        data: { drive_folder_id: partyFolderId },
      });
    }

    // Create or get trip folder
    let tripFolderId = trip.drive_folder_id;
    if (!tripFolderId) {
      const result = await DriveService.createTripFolder(
        partyFolderId, 
        trip.vehicle.vehicle_no, 
        new Date(trip.date)
      );
      tripFolderId = result.folderId;
      
      // Update trip with folder info
      await updateTrip.mutateAsync({
        id: trip.id,
        data: {
          drive_folder_id: tripFolderId,
          drive_folder_name: result.folderName,
        },
      });
    }

    return tripFolderId;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload POD images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take POD photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const uploadImage = async (imageUri: string) => {
    setUploading(true);
    try {
      // Test backend connection first
      console.log('🔍 Testing backend connection...');
      const isBackendReachable = await DriveService.testConnection();
      
      if (!isBackendReachable) {
        Alert.alert(
          'Backend Not Reachable',
          'Cannot connect to the backend server. Make sure it is running on http://localhost:3000\n\nRun: cd backend && node server.js'
        );
        return;
      }

      console.log('✅ Backend is reachable, proceeding with upload...');

      // Ensure folder structure exists
      const tripFolderId = await ensureTripFolder();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `POD_${timestamp}.jpg`;

      // Upload to Google Drive
      const { fileId: driveFileId, webViewLink } = await DriveService.uploadPodImage(tripFolderId, imageUri, fileName);

      // Save POD record to database
      await createPod.mutateAsync({
        trip_id: trip.id,
        image_url: webViewLink,
        drive_file_id: driveFileId,
        file_name: fileName,
      });

      // Update trip pod_uploaded status
      if (!trip.pod_uploaded) {
        await updateTrip.mutateAsync({
          id: trip.id,
          data: { pod_uploaded: true },
        });
      }

      Alert.alert('Success', 'POD image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed', 
        error.message || 'Failed to upload POD image. Check console for details.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePod = (podId: string, driveFileId: string, fileName: string) => {
    Alert.alert(
      'Delete POD Image',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Google Drive
              await DriveService.deletePodImage(driveFileId);
              // Delete from database
              await deletePod.mutateAsync({ id: podId, tripId: trip.id });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete POD image');
            }
          },
        },
      ]
    );
  };

  const openImage = (url: string) => {
    Linking.openURL(url);
  };

  const openFolder = () => {
    if (trip.drive_folder_id) {
      Linking.openURL(`https://drive.google.com/drive/folders/${trip.drive_folder_id}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Upload Actions */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Upload POD Image</Text>
        <View style={styles.uploadActions}>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={28} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="images" size={28} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading to Google Drive...</Text>
          </View>
        )}
      </Card>

      {/* Folder Link */}
      {trip.drive_folder_id && (
        <TouchableOpacity style={styles.folderLink} onPress={openFolder}>
          <Ionicons name="folder-open" size={20} color={Colors.primary} />
          <Text style={styles.folderLinkText}>
            Open folder: {trip.drive_folder_name || 'Trip Folder'}
          </Text>
          <Ionicons name="open-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* POD Images Grid */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>
          POD Images ({pods?.length || 0})
        </Text>

        {podsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : pods && pods.length > 0 ? (
          <FlatList
            data={pods}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <TouchableOpacity 
                  style={styles.imageCard}
                  onPress={() => openImage(item.image_url)}
                >
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="document-text" size={32} color={Colors.textSecondary} />
                    <Text style={styles.imageFileName} numberOfLines={1}>
                      {item.file_name}
                    </Text>
                  </View>
                  <View style={styles.imageActions}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => openImage(item.image_url)}
                    >
                      <Ionicons name="eye" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeletePod(item.id, item.drive_file_id, item.file_name)}
                    >
                      <Ionicons name="trash" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.imageGrid}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No POD images uploaded yet</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButton: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    minWidth: 100,
  },
  uploadButtonText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  uploadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  folderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  folderLinkText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  imageGrid: {
    gap: Spacing.sm,
  },
  imageContainer: {
    flex: 1,
    padding: Spacing.xs,
    maxWidth: '50%',
  },
  imageCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
  },
  imageFileName: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewButton: {
    padding: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  notConnected: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notConnectedTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  notConnectedText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  connectButton: {
    marginTop: Spacing.sm,
  },
});
