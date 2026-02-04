import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// TODO: Replace with your Google Cloud Console credentials
const GOOGLE_CLIENT_ID = '95069775972-4e8i6trtkmksmeju443ma7jdl6g4di02.apps.googleusercontent.com';
// const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';

// The root folder in Google Drive where all party folders will be created
// TODO: Replace with your Google Drive folder ID (create a folder called "SITS_POD" in Drive and get its ID)
const ROOT_FOLDER_ID = 'https://drive.google.com/drive/folders/1stqA7dsBUx49-0Novb-_MCuFFuuWpolg';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const STORAGE_KEY = 'google_drive_token';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Discovery document for Google OAuth
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class GoogleDriveService {
  private tokenData: TokenData | null = null;

  // Initialize by loading stored token
  async init(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.tokenData = JSON.parse(stored);
        // Check if token is expired
        if (this.tokenData && this.tokenData.expiresAt < Date.now()) {
          // Token expired, need to re-authenticate
          this.tokenData = null;
          await AsyncStorage.removeItem(STORAGE_KEY);
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading Google Drive token:', error);
      return false;
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.tokenData !== null && this.tokenData.expiresAt > Date.now();
  }

  // Get auth request hook (to be used in component)
  getAuthRequest() {
    return AuthSession.useAuthRequest(
      {
        clientId: GOOGLE_CLIENT_ID,
        scopes: SCOPES,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'sits',
        }),
      },
      discovery
    );
  }

  // Handle auth response
  async handleAuthResponse(response: AuthSession.AuthSessionResult): Promise<boolean> {
    if (response.type === 'success' && response.authentication) {
      const { accessToken, expiresIn, refreshToken } = response.authentication;
      
      this.tokenData = {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: Date.now() + ((expiresIn || 3600) * 1000),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.tokenData));
      return true;
    }
    return false;
  }

  // Sign out
  async signOut(): Promise<void> {
    this.tokenData = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  // Get access token
  private getAccessToken(): string {
    if (!this.tokenData) {
      throw new Error('Not authenticated with Google Drive');
    }
    return this.tokenData.accessToken;
  }

  // Create a folder in Google Drive
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const accessToken = this.getAccessToken();
    
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId || ROOT_FOLDER_ID],
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create folder: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id; // Return the folder ID
  }

  // Check if folder exists by name in parent folder
  async findFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    const accessToken = this.getAccessToken();
    const parent = parentFolderId || ROOT_FOLDER_ID;
    
    const query = `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search for folder');
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }

  // Create folder if it doesn't exist, otherwise return existing folder ID
  async getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const existingId = await this.findFolder(folderName, parentFolderId);
    if (existingId) {
      return existingId;
    }
    return await this.createFolder(folderName, parentFolderId);
  }

  // Upload a file to Google Drive
  async uploadFile(
    fileUri: string,
    fileName: string,
    mimeType: string,
    folderId: string
  ): Promise<{ id: string; webViewLink: string }> {
    const accessToken = this.getAccessToken();

    // First, create the file metadata
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    // Read the file
    const fileResponse = await fetch(fileUri);
    const fileBlob = await fileResponse.blob();

    // Create form data for multipart upload
    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', fileBlob);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to upload file: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      webViewLink: data.webViewLink,
    };
  }

  // Upload image with simpler approach for React Native
  async uploadImage(
    imageUri: string,
    fileName: string,
    folderId: string
  ): Promise<{ id: string; webViewLink: string }> {
    const accessToken = this.getAccessToken();

    // Step 1: Create file metadata and get upload URL
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      throw new Error('Failed to initialize upload');
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL received');
    }

    // Step 2: Read and upload the image
    const imageResponse = await fetch(imageUri);
    const imageBlob = await imageResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    const fileData = await uploadResponse.json();

    // Step 3: Get the web view link
    const fileInfoResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileData.id}?fields=webViewLink,webContentLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const fileInfo = await fileInfoResponse.json();

    // Make file publicly viewable
    await this.makeFilePublic(fileData.id);

    return {
      id: fileData.id,
      webViewLink: fileInfo.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    };
  }

  // Make a file publicly viewable
  async makeFilePublic(fileId: string): Promise<void> {
    const accessToken = this.getAccessToken();

    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  }

  // Get folder link
  getFolderLink(folderId: string): string {
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  // Delete a file
  async deleteFile(fileId: string): Promise<void> {
    const accessToken = this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to delete file');
    }
  }

  // List files in a folder
  async listFiles(folderId: string): Promise<Array<{ id: string; name: string; webViewLink: string }>> {
    const accessToken = this.getAccessToken();
    
    const query = `'${folderId}' in parents and trashed=false`;
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,thumbnailLink)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return data.files || [];
  }
}

// Helper function to generate trip folder name
export function generateTripFolderName(vehicleNo: string, date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lastFour = vehicleNo.slice(-4);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  
  return `${lastFour}_${day}-${month}`;
}

// Export singleton instance
export const googleDrive = new GoogleDriveService();
