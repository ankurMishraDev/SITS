# Backend Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- NPM or Yarn
- Google Cloud Project with Drive API enabled
- Service Account credentials (serviceAccount.json)

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory (already created) with:
```
PORT=3000
ROOT_FOLDER_ID=your_root_folder_id_here
```

The `ROOT_FOLDER_ID` is the ID of the Google Drive folder where all party folders will be created.

### 3. Add Service Account Credentials
Copy your `serviceAccount.json` file from the root directory to the backend directory:
```bash
# From project root
cp serviceAccount.json backend/
```

**IMPORTANT:** Never commit `serviceAccount.json` to version control!

### 4. Share Root Folder with Service Account
1. Open Google Drive and navigate to your root folder (ID: 1stqA7dsBUx49-0Novb-_MCuFFuuWpolg)
2. Right-click → Share
3. Add the service account email: `sits-378@sits-486022.iam.gserviceaccount.com`
4. Give it "Editor" permissions
5. Click "Share"

### 5. Start the Backend Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 6. Test the API
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "SITS Backend API is running"
}
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Create Party Folder
- **POST** `/api/drive/create-party-folder`
- Body: `{ "partyName": "string" }`
- Creates a folder in the root Drive folder for the party

### Create Trip Folder
- **POST** `/api/drive/create-trip-folder`
- Body: `{ "partyFolderId": "string", "folderName": "string" }`
- Creates a subfolder inside the party folder for the trip
- Folder name format: `{last4VehicleDigits}_{DD}-{Mon}` (e.g., "3485_31-Jan")

### Upload POD Image
- **POST** `/api/drive/upload-image`
- Content-Type: `multipart/form-data`
- Fields:
  - `tripFolderId`: string
  - `fileName`: string
  - `image`: file
- Uploads an image to the trip folder

### Delete POD Image
- **DELETE** `/api/drive/delete-image/:fileId`
- Deletes an image from Google Drive

### List POD Images
- **GET** `/api/drive/list-images/:tripFolderId`
- Lists all images in a trip folder

## Mobile App Configuration

Update the `API_BASE_URL` in `src/services/DriveService.ts`:

For development with Android emulator:
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api/drive';
```

For development with physical device (use your computer's IP):
```typescript
const API_BASE_URL = 'http://192.168.1.X:3000/api/drive';
```

For production:
```typescript
const API_BASE_URL = 'https://your-domain.com/api/drive';
```

## Deployment

### Option 1: Railway.app
1. Create account on Railway.app
2. Create new project from GitHub repo
3. Add environment variables (PORT, ROOT_FOLDER_ID)
4. Upload serviceAccount.json as secret file
5. Deploy

### Option 2: Heroku
```bash
heroku create sits-backend
heroku config:set ROOT_FOLDER_ID=your_folder_id
# Add serviceAccount.json using Heroku Config Vars or buildpack
git push heroku main
```

### Option 3: DigitalOcean App Platform
1. Create new app from GitHub repo
2. Set environment variables
3. Upload serviceAccount.json
4. Deploy

## Security Notes

- **Never commit** `serviceAccount.json` to version control
- **Never expose** the backend API publicly without authentication
- Consider adding API key authentication for production
- Use HTTPS in production
- Rate limit the endpoints to prevent abuse

## Troubleshooting

### "Service account not found" error
- Make sure serviceAccount.json is in the backend directory
- Check that the file is valid JSON

### "Folder not found" error
- Verify ROOT_FOLDER_ID in .env
- Make sure the service account has access to the root folder

### "Permission denied" error
- Share the root folder with the service account email
- Give "Editor" permissions

### CORS errors from mobile app
- The backend already has CORS enabled
- Check that API_BASE_URL is correct in DriveService.ts
