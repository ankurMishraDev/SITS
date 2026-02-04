# Google Drive Integration - Complete Setup

## ✅ What's Been Implemented

### Backend Server (Service Account Approach)
- **Location**: `backend/server.js`
- **Status**: ✅ Running on port 3000
- **Approach**: Service account authentication (no OAuth required!)

### API Endpoints Created
1. **POST** `/api/drive/create-party-folder` - Creates party folder
2. **POST** `/api/drive/create-trip-folder` - Creates trip folder with format: `{last4digits}_{DD-Mon}`
3. **POST** `/api/drive/upload-image` - Uploads POD images
4. **DELETE** `/api/drive/delete-image/:fileId` - Deletes images
5. **GET** `/api/drive/list-images/:tripFolderId` - Lists all images in folder

### Mobile App Integration
- **Service**: `src/services/DriveService.ts` - Clean API client
- **Component**: `src/components/trip/PodSection.tsx` - Updated to use DriveService
- **No OAuth UI needed** - Works seamlessly in background

## 📁 Folder Structure

When you create a party and trip, the following structure is created in Google Drive:

```
Root Folder (1stqA7dsBUx49-0Novb-_MCuFFuuWpolg)
└── Party Name (e.g., "ABC Company")
    └── 3485_31-Jan (Vehicle: MP09HH3485, Date: Jan 31)
        ├── POD_2026-01-31T10-30-45.jpg
        ├── POD_2026-01-31T14-20-12.jpg
        └── ...
```

### Folder Naming Convention
- **Party Folder**: Party name (e.g., "ABC Company")
- **Trip Folder**: `{last4VehicleDigits}_{DD-Mon}` (e.g., "3485_31-Jan")
  - Last 4 digits from vehicle number: `MP09HH3485` → `3485`
  - Date formatted as: `31-Jan`, `05-Feb`, etc.

## 🚀 How It Works

### 1. Creating a Party
```typescript
// When party is created, folder is automatically created
const { folderId } = await DriveService.createPartyFolder("ABC Company");
// Updates party record with drive_folder_id
```

### 2. Creating a Trip
```typescript
// When trip is viewed, folder is created on first POD upload
const { folderId, folderName } = await DriveService.createTripFolder(
  partyFolderId,
  "MP09HH3485",  // Vehicle number
  new Date("2026-01-31")  // Trip date
);
// Creates folder: "3485_31-Jan"
// Updates trip record with drive_folder_id and drive_folder_name
```

### 3. Uploading POD Images
```typescript
// User takes photo or selects from gallery
const { fileId, webViewLink } = await DriveService.uploadPodImage(
  tripFolderId,
  imageUri,
  "POD_2026-01-31T10-30-45.jpg"
);
// Image uploaded to Drive
// POD record created in database with drive_file_id
// Image accessible via webViewLink
```

## 🔧 Configuration

### Backend (.env)
```
PORT=3000
ROOT_FOLDER_ID=1stqA7dsBUx49-0Novb-_MCuFFuuWpolg
```

### Mobile App (.env)
```
# Default: http://10.0.2.2:3000/api/drive (for Android Emulator)
# For physical device, uncomment and set your computer's IP:
# EXPO_PUBLIC_BACKEND_URL=http://192.168.1.X:3000/api/drive
```

### Service Account
- **Email**: sits-378@sits-486022.iam.gserviceaccount.com
- **Credentials**: `backend/serviceAccount.json`
- **⚠️ IMPORTANT**: Share your root folder with this email!

## ⚠️ Next Steps - MUST DO

### 1. Share Root Folder with Service Account
1. Open Google Drive: https://drive.google.com/drive/folders/1stqA7dsBUx49-0Novb-_MCuFFuuWpolg
2. Right-click the folder → Share
3. Add email: `sits-378@sits-486022.iam.gserviceaccount.com`
4. Set permission: **Editor**
5. Click **Share**

### 2. For Physical Device Testing
If testing on a real Android device (not emulator):
1. Find your computer's IP address: `ipconfig` (look for IPv4 Address)
2. Update `.env`:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://192.168.1.X:3000/api/drive
   ```
3. Make sure your device is on the same WiFi network

### 3. Backend Server Commands
```bash
# Start development server (with auto-restart)
cd backend
npm run dev

# Start production server
npm start

# Check if running
curl http://localhost:3000/health
```

## 🎯 Testing the Integration

### Test Flow:
1. ✅ Backend server is running (`npm run dev` in backend folder)
2. ✅ Mobile app is running (`npx expo start` in root)
3. ✅ Open a trip in the app
4. ✅ Tap "Camera" or "Gallery" in POD section
5. ✅ Take/select a photo
6. ✅ Image uploads to Google Drive automatically
7. ✅ Folder structure created automatically
8. ✅ POD record saved to database
9. ✅ "Open folder" link appears - click to view in Drive

### What Happens Behind the Scenes:
1. First POD upload triggers folder creation:
   - Party folder created (if doesn't exist)
   - Trip folder created with format: `3485_31-Jan`
   - Database updated with folder IDs
2. Image uploaded to trip folder
3. File made publicly viewable (anyone with link)
4. POD record created with Drive file ID and web link
5. Trip marked as `pod_uploaded: true`

## 🔒 Security Notes

- ✅ Service account credentials stored securely on backend (not in mobile app)
- ✅ Backend has CORS enabled for mobile app access
- ✅ Images made publicly viewable (for Excel linking)
- ⚠️ Consider adding API authentication for production
- ⚠️ Never commit `serviceAccount.json` to version control

## 📱 Mobile App Features

### PodSection Component:
- ✅ Take photo with camera
- ✅ Select from gallery
- ✅ Upload progress indicator
- ✅ Grid view of all POD images
- ✅ Open individual images in browser
- ✅ Open trip folder in Drive
- ✅ Delete images (from Drive and database)
- ✅ No OAuth login required!

### Database Updates:
- **Party**: `drive_folder_id` field
- **Trip**: `drive_folder_id`, `drive_folder_name` fields
- **Pod**: `drive_file_id`, `file_name`, `image_url` fields

## 🎉 Advantages of This Approach

1. **No OAuth Complexity**: Service account handles authentication
2. **Works in Background**: No user interaction needed
3. **Centralized Storage**: All data in one Drive account
4. **Excel Compatible**: Images have stable web links
5. **Automatic Organization**: Folders created automatically
6. **Consistent Naming**: Last 4 digits + date format
7. **No Token Expiration**: Service account doesn't expire

## 🐛 Troubleshooting

### "Permission denied" error
→ Share root folder with service account email

### "Cannot connect to backend"
→ Check backend is running: `cd backend && npm run dev`
→ For physical device, use computer's IP in EXPO_PUBLIC_BACKEND_URL

### "Folder not found"
→ Verify ROOT_FOLDER_ID in backend/.env
→ Share folder with service account

### Images not uploading
→ Check backend logs for errors
→ Verify service account has editor permissions
→ Check image file size (large files may timeout)

## 📚 File References

- Backend Server: [backend/server.js](backend/server.js)
- Backend Setup: [backend/README.md](backend/README.md)
- Drive Service: [src/services/DriveService.ts](src/services/DriveService.ts)
- POD Component: [src/components/trip/PodSection.tsx](src/components/trip/PodSection.tsx)
- Database Types: [src/types/database.ts](src/types/database.ts)

---

**Status**: ✅ Implementation Complete - Ready for Testing!
**Last Updated**: Feb 2, 2026
