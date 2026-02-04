const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
const TOKENS_PATH = path.join(__dirname, 'tokens.json');

// OAuth2 Client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

// Load saved tokens if they exist
if (fs.existsSync(TOKENS_PATH)) {
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
  oauth2Client.setCredentials(tokens);
  console.log('✅ OAuth tokens loaded');
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Middleware for logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SITS Backend API is running' });
});

// Check OAuth status
app.get('/auth/status', (req, res) => {
  const isAuthenticated = fs.existsSync(TOKENS_PATH);
  res.json({ authenticated: isAuthenticated });
});

// Start OAuth flow
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Save tokens to file
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
    
    console.log('✅ OAuth tokens saved successfully');
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Authentication Successful!</h1>
          <p>You can close this window and return to your app.</p>
          <p>Backend is now connected to your Google Drive.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Create party folder
app.post('/api/drive/create-party-folder', async (req, res) => {
  try {
    console.log('📥 Request body:', JSON.stringify(req.body));
    console.log('📥 Content-Type:', req.headers['content-type']);
    
    const { partyName } = req.body;
    
    console.log('📁 Creating party folder:', partyName);
    
    if (!partyName) {
      console.log('❌ Party name is missing from request');
      return res.status(400).json({ error: 'Party name is required' });
    }

    // Check if folder already exists
    const existingFolder = await findFolder(partyName, ROOT_FOLDER_ID);
    if (existingFolder) {
      console.log('✅ Party folder already exists:', existingFolder);
      return res.json({ folderId: existingFolder, folderLink: `https://drive.google.com/drive/folders/${existingFolder}` });
    }

    // Create new folder
    const fileMetadata = {
      name: partyName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER_ID],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    console.log('✅ Party folder created:', folder.data.id);
    res.json({ 
      folderId: folder.data.id,
      folderLink: `https://drive.google.com/drive/folders/${folder.data.id}`
    });
  } catch (error) {
    console.error('❌ Error creating party folder:', error);
    res.status(500).json({ error: 'Failed to create party folder', details: error.message });
  }
});

// Create trip folder
app.post('/api/drive/create-trip-folder', async (req, res) => {
  try {
    const { partyFolderId, folderName } = req.body;
    
    console.log('📁 Creating trip folder:', folderName, 'in party:', partyFolderId);
    
    if (!partyFolderId || !folderName) {
      return res.status(400).json({ error: 'Party folder ID and folder name are required' });
    }

    // Check if folder already exists
    const existingFolder = await findFolder(folderName, partyFolderId);
    if (existingFolder) {
      console.log('✅ Trip folder already exists:', existingFolder);
      return res.json({ folderId: existingFolder, folderLink: `https://drive.google.com/drive/folders/${existingFolder}` });
    }

    // Create new folder
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [partyFolderId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    console.log('✅ Trip folder created:', folder.data.id);
    res.json({ 
      folderId: folder.data.id,
      folderLink: `https://drive.google.com/drive/folders/${folder.data.id}`
    });
  } catch (error) {
    console.error('❌ Error creating trip folder:', error);
    res.status(500).json({ error: 'Failed to create trip folder', details: error.message });
  }
});

// Upload POD image
app.post('/api/drive/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Upload request received');
    console.log('📥 Content-Type:', req.headers['content-type']);
    console.log('📥 Body:', req.body);
    console.log('📥 File:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
    
    const { tripFolderId, fileName } = req.body;
    
    console.log('📤 Uploading image:', fileName, 'to folder:', tripFolderId);
    
    if (!tripFolderId || !fileName || !req.file) {
      console.log('❌ Missing required fields:');
      console.log('  - tripFolderId:', tripFolderId ? '✓' : '✗');
      console.log('  - fileName:', fileName ? '✓' : '✗');
      console.log('  - file:', req.file ? '✓' : '✗');
      return res.status(400).json({ error: 'Trip folder ID, file name, and image are required' });
    }

    const fileMetadata = {
      name: fileName,
      parents: [tripFolderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: require('stream').Readable.from(req.file.buffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    console.log('✅ Image uploaded:', file.data.id);

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('✅ Image made public');

    res.json({
      fileId: file.data.id,
      webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Delete POD image
app.delete('/api/drive/delete-image/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    await drive.files.delete({
      fileId: fileId,
    });

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image', details: error.message });
  }
});

// List POD images in trip folder
app.get('/api/drive/list-images/:tripFolderId', async (req, res) => {
  try {
    const { tripFolderId } = req.params;
    
    if (!tripFolderId) {
      return res.status(400).json({ error: 'Trip folder ID is required' });
    }

    const response = await drive.files.list({
      q: `'${tripFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, thumbnailLink)',
    });

    const images = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images', details: error.message });
  }
});

// Helper function to find existing folder
async function findFolder(folderName, parentFolderId) {
  try {
    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    return response.data.files.length > 0 ? response.data.files[0].id : null;
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SITS Backend API running on port ${PORT}`);
  console.log(`📁 Root Folder ID: ${ROOT_FOLDER_ID}`);
});
