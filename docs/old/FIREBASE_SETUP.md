# 🔥 Firebase Integration - Smart Geyser App

## ✅ Firebase Integration Complete!

Your Smart Geyser app now has **full Firebase integration** with real-time master/slave device management!

## 🚀 What's Been Implemented

### **Firebase Authentication**
- ✅ Real user registration and login
- ✅ Password reset functionality  
- ✅ Persistent authentication with AsyncStorage
- ✅ Master/Slave user type management

### **Real-time Database (Firestore)**
- ✅ User profiles with permissions
- ✅ Geyser data with live sync
- ✅ Slave device requests system
- ✅ Schedule management
- ✅ Action logging for audit trail

### **Master/Slave System**
- ✅ QR code/Manual geyser connection
- ✅ Real-time permission requests
- ✅ Live approval/denial system
- ✅ Granular permission management
- ✅ Device status tracking

## 📋 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install firebase @react-native-async-storage/async-storage
```

### Step 2: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: `smart-geyser-app`
3. Enable Google Analytics (optional)

### Step 3: Enable Authentication
1. Go to Authentication → Get started
2. Sign-in method → Enable "Email/Password"
3. Save changes

### Step 4: Create Firestore Database
1. Go to Firestore Database → Create database
2. Start in **test mode** (for development)
3. Choose your preferred location
4. Click Done

### Step 5: Get Firebase Configuration
1. Project Settings (gear icon) → General
2. Your apps → Add app → Web
3. Register app: `smart-geyser-web`
4. Copy the configuration object

### Step 6: Update Configuration
Replace the config in `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

### Step 7: Update Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can manage their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Masters can read their slave devices
    match /users/{userId} {
      allow read, update: if request.auth != null && 
        resource.data.masterUID == request.auth.uid;
    }
    
    // Geyser data access for masters and authorized slaves
    match /geysers/{geyserID} {
      allow read, write: if request.auth != null && (
        resource.data.masterUID == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.geyserID == geyserID)
      );
    }
    
    // Slave requests management
    match /slaveRequests/{requestId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && (
        request.auth.uid == requestId ||
        resource.data.masterUID == request.auth.uid
      );
    }
    
    // Schedules and logs
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null;
    }
    
    match /actionLogs/{logId} {
      allow write: if request.auth != null;
      allow read: if request.auth != null;
    }
  }
}
```

## 🗄️ Database Structure

### Users Collection (`/users/{uid}`)
```javascript
{
  uid: "user-123",
  email: "user@example.com",
  displayName: "John Doe",
  userType: "master" | "slave",
  geyserID: "GYS-123456", // Auto-generated for masters
  masterUID: "master-uid", // For slaves only
  permissions: { // For slaves only
    canControlTemperature: true,
    canControlSchedules: false,
    canControlMode: true,
    canReceiveNotifications: true
  },
  createdAt: timestamp,
  lastActive: timestamp
}
```

### Geysers Collection (`/geysers/{geyserID}`)
```javascript
{
  id: "GYS-123456",
  masterUID: "master-uid",
  name: "Home Geyser",
  isOn: true,
  temperature: 45,
  targetTemperature: 50,
  mode: "electric" | "gas" | "hybrid",
  lastUpdated: timestamp,
  energyUsage: {
    today: 2.4,
    thisWeek: 15.2,
    thisMonth: 65.8
  },
  settings: {
    maxTemperature: 100,
    minTemperature: 30,
    autoShutoff: true,
    energySaver: false
  }
}
```

### Slave Requests (`/slaveRequests/{requestId}`)
```javascript
{
  deviceName: "Kitchen Phone",
  deviceId: "slave-uid",
  geyserID: "GYS-123456",
  masterUID: "master-uid",
  requestTime: timestamp,
  status: "pending" | "approved" | "denied"
}
```

## 🔄 Real-time Features

### **Live Slave Requests**
- Masters receive instant notifications
- Real-time approval/denial updates
- Automatic request cleanup

### **Synchronized Geyser Control**
- Temperature changes sync instantly
- Mode switches update all devices
- On/off status reflects immediately

### **Permission Management**
- Real-time permission updates
- Instant access revocation
- Live device status tracking

## 🧪 Testing the Integration

### **Master Flow**
1. Create account → Gets auto-generated Geyser ID
2. Go to Slave Management → See pending requests
3. Approve/deny requests with custom permissions
4. Control geyser → Changes sync to all slaves

### **Slave Flow**  
1. Connect as Slave Device → Enter Geyser ID
2. Wait for approval → Real-time status updates
3. Access granted → Limited controls based on permissions
4. Use geyser controls → Actions logged and synced

## 🔧 Services Available

### **AuthContext**
- `signIn()`, `signUp()`, `signOut()`
- `requestSlaveAccess()`, `approveSlaveRequest()`
- `updateSlavePermissions()`, `removeSlaveDevice()`

### **GeyserService**
- `getGeyserData()`, `updateGeyserData()`
- `toggleGeyser()`, `setTemperature()`, `setMode()`
- `getSchedules()`, `createSchedule()`
- `getSlaveDevices()`, `subscribeToGeyserData()`

## 🚨 Troubleshooting

### **Common Issues**

1. **"Firebase not initialized"**
   - Update config in `config/firebase.ts`
   - Install: `npm install firebase`

2. **Authentication errors**
   - Enable Email/Password in Firebase Console
   - Check API key is correct

3. **Permission denied errors**
   - Update Firestore security rules
   - Use test mode during development

4. **Real-time not working**
   - Check internet connection
   - Verify Firestore rules allow read access

### **Development Tips**

- Use Firebase Emulator Suite for local testing
- Check Firebase Console for real-time data
- Monitor network tab for Firestore calls
- Use test mode rules during development

## 🎯 Production Checklist

- [ ] Update Firebase config with production values
- [ ] Set restrictive Firestore security rules
- [ ] Enable App Check for additional security
- [ ] Set up proper error handling
- [ ] Add offline persistence
- [ ] Configure push notifications
- [ ] Set up monitoring and analytics

## 📱 Features Ready

✅ **Real-time Master/Slave System**
✅ **Firebase Authentication** 
✅ **Live Geyser Control**
✅ **Permission Management**
✅ **Device Status Tracking**
✅ **Audit Logging**
✅ **Schedule Management**
✅ **Offline Support Ready**

Your Smart Geyser app is now powered by Firebase with full real-time capabilities! 🔥🚀