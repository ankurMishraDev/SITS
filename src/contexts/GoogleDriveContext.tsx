import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration - loaded from .env file
// Use Android client ID for native app (PKCE flow, no secret needed)
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const ROOT_FOLDER_ID = process.env.EXPO_PUBLIC_DRIVE_ROOT_FOLDER_ID || '';

const STORAGE_KEY = 'google_drive_auth';

// Discovery document for Google OAuth
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface GoogleDriveContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createPartyFolder: (partyName: string) => Promise<string>;
  createTripFolder: (partyFolderId: string, folderName: string) => Promise<string>;
  uploadPodImage: (tripFolderId: string, imageUri: string, fileName: string) => Promise<{ id: string; webViewLink: string }>;
  deletePodImage: (fileId: string) => Promise<void>;
  listPodImages: (tripFolderId: string) => Promise<Array<{ id: string; name: string; webViewLink: string }>>;
  getFolderLink: (folderId: string) => string;
  rootFolderId: string;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | null>(null);

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
}

export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create redirect URI using reverse DNS for Android OAuth
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.ankurmishra.sits',
    path: 'oauth2redirect',
  });

  console.log('Redirect URI:', redirectUri);

  // Use authorization code flow with PKCE (Android native app)
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
    discovery
  );

  // Load stored token on mount
  useEffect(() => {
    loadStoredToken();
  }, []);

  // Handle auth response - exchange code for tokens
  useEffect(() => {
    if (response?.type === 'success') {
      const code = response.params?.code as string | undefined;
      if (code) {
        exchangeCodeForTokens(code);
      }
    }
  }, [response]);

  const exchangeCodeForTokens = async (code: string) => {
    try {
      // Use AuthSession to exchange code (handles PKCE automatically)
      if (!request?.codeVerifier) {
        throw new Error('Code verifier not found');
      }

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          code,
          clientId: GOOGLE_CLIENT_ID,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery
      );
      
      if (tokenResponse.accessToken) {
        const newTokenData: TokenData = {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresAt: Date.now() + ((tokenResponse.expiresIn || 3600) * 1000),
        };
        setTokenData(newTokenData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTokenData));
      } else {
        Alert.alert('Error', 'Failed to get access token');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      Alert.alert('Error', 'Failed to exchange authorization code');
    }
  };

  const loadStoredToken = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: TokenData = JSON.parse(stored);
        if (data.expiresAt > Date.now()) {
          setTokenData(data);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    setTokenData(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getAccessToken = useCallback((): string => {
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      throw new Error('Not authenticated with Google Drive');
    }
    return tokenData.accessToken;
  }, [tokenData]);

  // Create a folder for a party
  const createPartyFolder = useCallback(async (partyName: string): Promise<string> => {
    const accessToken = getAccessToken();
    
    // First check if folder already exists
    const existingId = await findFolder(accessToken, partyName, ROOT_FOLDER_ID);
    if (existingId) return existingId;

    const metadata = {
      name: partyName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER_ID],
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
      throw new Error(error.error?.message || 'Failed to create party folder');
    }

    const data = await response.json();
    return data.id;
  }, [getAccessToken]);

  // Create a folder for a trip inside party folder
  const createTripFolder = useCallback(async (partyFolderId: string, folderName: string): Promise<string> => {
    const accessToken = getAccessToken();

    // Check if folder already exists
    const existingId = await findFolder(accessToken, folderName, partyFolderId);
    if (existingId) return existingId;

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [partyFolderId],
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
      throw new Error(error.error?.message || 'Failed to create trip folder');
    }

    const data = await response.json();
    return data.id;
  }, [getAccessToken]);

  // Upload POD image
  const uploadPodImage = useCallback(async (
    tripFolderId: string,
    imageUri: string,
    fileName: string
  ): Promise<{ id: string; webViewLink: string }> => {
    const accessToken = getAccessToken();

    // Initialize resumable upload
    const metadata = {
      name: fileName,
      parents: [tripFolderId],
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

    // Read and upload the image
    const imageResponse = await fetch(imageUri);
    const imageBlob = await imageResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': imageBlob.type || 'image/jpeg',
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    const fileData = await uploadResponse.json();

    // Make file publicly viewable
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
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

    return {
      id: fileData.id,
      webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`,
    };
  }, [getAccessToken]);

  // Delete a POD image
  const deletePodImage = useCallback(async (fileId: string): Promise<void> => {
    const accessToken = getAccessToken();

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
  }, [getAccessToken]);

  // List POD images in a trip folder
  const listPodImages = useCallback(async (
    tripFolderId: string
  ): Promise<Array<{ id: string; name: string; webViewLink: string }>> => {
    const accessToken = getAccessToken();
    
    const query = `'${tripFolderId}' in parents and trashed=false`;
    
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
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    }));
  }, [getAccessToken]);

  const getFolderLink = useCallback((folderId: string): string => {
    return `https://drive.google.com/drive/folders/${folderId}`;
  }, []);

  const value: GoogleDriveContextType = {
    isAuthenticated: tokenData !== null && tokenData.expiresAt > Date.now(),
    isLoading,
    signIn,
    signOut,
    createPartyFolder,
    createTripFolder,
    uploadPodImage,
    deletePodImage,
    listPodImages,
    getFolderLink,
    rootFolderId: ROOT_FOLDER_ID,
  };

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
}

// Helper function to find folder by name
async function findFolder(accessToken: string, folderName: string, parentFolderId: string): Promise<string | null> {
  const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
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
