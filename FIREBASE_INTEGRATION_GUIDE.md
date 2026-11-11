# Firebase Integration Guide

## ✅ Completed Updates

Your project has been successfully updated to use the new Firebase database structure with Realtime Database. Here's what was changed:

### 1. Firebase Configuration (`config/firebase.ts`)
- Updated to use the standard Firebase web SDK
- Removed React Native Firebase dependencies that were causing issues
- Simplified authentication setup

### 2. Database Structure
Your app now uses the following Realtime Database structure:
```json
{
  "users": {
    "userId": {
      "uid": "userId",
      "email": "user@example.com",
      "displayName": "User Name",
      "claimedDeviceId": "device123",
      "createdAt": "2025-01-08T10:30:00.000Z",
      "lastLogin": "2025-01-08T10:30:00.000Z"
    }
  },
  "DEVICES": {
    "deviceId": {
      "current_Temp": 25,
      "target_Temp": 45,
      "mode": "electric",
      "status": "online",
      "userId": "userId",
      "lastUpdated": "2025-01-08T10:30:00.000Z"
    }
  },
  "localDevices": {
    "userId": {
      "name": "My Smart Geyser",
      "status": "online",
      "deviceId": "device123"
    }
  }
}
```

### 3. Updated Context Files
- **AuthContext**: Now uses Realtime Database for user management
- **GeyserContext**: Simplified to work with the new device structure

### 4. Updated Services
- **geyserService**: Handles device operations using Realtime Database
- **realtimeDbService**: Core database operations

## 🔧 Next Steps

### 1. Update Firebase Configuration
Replace the placeholder values in `config/firebase.ts` with your actual Firebase project settings:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2. Firebase Security Rules
Add these security rules to your Firebase Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "DEVICES": {
      "$deviceId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('claimedDeviceId').val() == $deviceId || data.child('userId').val() == auth.uid)",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('claimedDeviceId').val() == $deviceId || data.child('userId').val() == auth.uid)"
      }
    },
    "localDevices": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "actionLogs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. Test the Integration
1. Update your Firebase config with real values
2. Test user registration/login
3. Test device claiming functionality
4. Test temperature and mode updates

## 📱 Key Features Available

### Authentication
- Email/password signup and login
- User profile management
- Automatic session persistence

### Device Management
- Device claiming by ID
- Real-time temperature monitoring
- Mode switching (electric/gas/hybrid)
- Local device naming and status

### Real-time Updates
- Live temperature updates
- Device status changes
- User activity tracking

## 🔍 Usage Examples

### Claiming a Device
```typescript
import { useGeyser } from '../contexts/GeyserContext';

const { claimDevice } = useGeyser();
await claimDevice('DEVICE123', 'My Smart Geyser');
```

### Updating Device Settings
```typescript
const { updateDeviceSettings } = useGeyser();
await updateDeviceSettings(45, 'electric');
```

### Monitoring Device Data
```typescript
const { device, localDevice } = useGeyser();
console.log('Current temp:', device?.current_Temp);
console.log('Target temp:', device?.target_Temp);
```

## 🚀 Ready to Go!

Your Firebase integration is now complete and ready for testing. Just update the configuration values and you'll be connected to your new database structure!