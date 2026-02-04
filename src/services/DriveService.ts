import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';

// Get backend URL from environment variable
// For Android emulator use 10.0.2.2 (maps to host's localhost)
// For physical device, replace with your computer's IP address (e.g., 'http://192.168.1.X:3000/api/drive')
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:3000/api/drive';

// Log the API URL being used
console.log('🔧 DriveService initialized');
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);

export class DriveService {
  /**
   * Test backend connection
   * @returns true if backend is reachable
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing backend connection:', `${API_BASE_URL.replace('/api/drive', '')}/health`);
      const response = await fetch(`${API_BASE_URL.replace('/api/drive', '')}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is reachable:', data.message);
        return true;
      }
      
      console.log('❌ Backend returned status:', response.status);
      return false;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  /**
   * Create a party folder in Google Drive
   * @param partyName - Name of the party
   * @returns Folder ID and link
   */
  static async createPartyFolder(partyName: string): Promise<{ folderId: string; folderLink: string }> {
    try {
      const url = `${API_BASE_URL}/create-party-folder`;
      console.log('📤 Creating party folder:', partyName);
      console.log('📤 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partyName }),
      });

      console.log('📥 Response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Backend error (${response.status}): ${responseText}`);
        }
        throw new Error(error.error || 'Failed to create party folder');
      }

      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('❌ Error creating party folder:', error.message);
      throw error;
    }
  }

  /**
   * Create a trip folder inside a party folder
   * @param partyFolderId - ID of the parent party folder
   * @param vehicleNo - Full vehicle number (last 4 digits will be used)
   * @param date - Date object for the trip
   * @returns Folder ID and link
   */
  static async createTripFolder(
    partyFolderId: string,
    vehicleNo: string,
    date: Date
  ): Promise<{ folderId: string; folderLink: string; folderName: string }> {
    try {
      // Extract last 4 digits from vehicle number
      const last4Digits = vehicleNo.slice(-4);
      
      // Format date as DD-Mon (e.g., "31-Jan")
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      
      // Create folder name: "3485_31-Jan"
      const folderName = `${last4Digits}_${day}-${month}`;

      const response = await fetch(`${API_BASE_URL}/create-trip-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partyFolderId, folderName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create trip folder');
      }

      const result = await response.json();
      return { ...result, folderName };
    } catch (error) {
      console.error('Error creating trip folder:', error);
      throw error;
    }
  }

  /**
   * Upload a POD image to a trip folder
   * @param tripFolderId - ID of the trip folder
   * @param imageUri - Local URI of the image
   * @param fileName - Name for the uploaded file
   * @returns File ID and web view link
   */
  static async uploadPodImage(
    tripFolderId: string,
    imageUri: string,
    fileName?: string
  ): Promise<{ fileId: string; webViewLink: string }> {
    try {
      // Generate filename if not provided
      const finalFileName = fileName || `POD_${Date.now()}.jpg`;

      const uploadUrl = `${API_BASE_URL}/upload-image`;
      console.log('📤 Upload URL:', uploadUrl);
      console.log('📤 API_BASE_URL:', API_BASE_URL);
      console.log('📤 Trip folder ID:', tripFolderId);
      console.log('📤 File name:', finalFileName);
      console.log('📤 Image URI:', imageUri);

      // Upload image using uploadAsync from legacy
      const uploadOptions = {
        fieldName: 'image',
        httpMethod: 'POST' as 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        parameters: {
          tripFolderId: tripFolderId,
          fileName: finalFileName,
        },
      };
      
      console.log('📤 Upload options:', JSON.stringify(uploadOptions, null, 2));

      const response = await uploadAsync(uploadUrl, imageUri, uploadOptions);

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', JSON.stringify(response.headers, null, 2));
      console.log('📥 Response body (first 500 chars):', response.body.substring(0, 500));

      // Check if response is actually JSON
      let result;
      try {
        result = JSON.parse(response.body);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON');
        console.error('Response body was:', response.body);
        throw new Error(`Backend returned invalid response. Status: ${response.status}. Make sure backend is running on http://localhost:3000`);
      }
      
      if (response.status !== 200) {
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      console.log('✅ Upload successful:', result.fileId);
      return result;
    } catch (error: any) {
      console.error('❌ Error uploading POD image:', error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a POD image from Google Drive
   * @param fileId - ID of the file to delete
   */
  static async deletePodImage(fileId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-image/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting POD image:', error);
      throw error;
    }
  }

  /**
   * List all POD images in a trip folder
   * @param tripFolderId - ID of the trip folder
   * @returns Array of images with their IDs and links
   */
  static async listPodImages(tripFolderId: string): Promise<Array<{ id: string; name: string; webViewLink: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/list-images/${tripFolderId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list images');
      }

      const result = await response.json();
      return result.images;
    } catch (error) {
      console.error('Error listing POD images:', error);
      throw error;
    }
  }
}
