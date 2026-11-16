# Device Claiming Fix

## Issue
When users signed up using a device ID, the device was not being automatically claimed after account creation.

## Root Cause
The device claiming logic was happening in the `AuthContext` signup function before the user data was fully loaded and the real-time listener was set up. This caused timing issues where the device claiming would fail or not be reflected in the UI.

## Solution
1. **Centralized device claiming**: Moved all device claiming logic to `AppRouter` where it happens after the user data is fully loaded and the real-time listener is active.

2. **Better timing**: Added proper checks and delays to ensure the user data is available before attempting to claim the device.

3. **Enhanced logging**: Added comprehensive logging throughout the flow to track what's happening.

## Changes Made

### 1. AppRouter (`app/index.tsx`)
- Added `useGeyser` hook to access `claimDevice` function
- Added `handlePendingDeviceClaim` function that runs after user authentication
- Added proper checks for pending device claims in AsyncStorage
- Added logging to track the claiming process

### 2. AuthContext (`contexts/AuthContext.tsx`)
- Removed device claiming logic from `signup` and `login` functions
- Simplified the authentication flow to focus on user creation/login
- Added logging to indicate that device claiming is handled by AppRouter

### 3. GeyserService (`services/geyserService.ts`)
- Enhanced `claimDevice` function with detailed logging
- Added validation checks with logging
- Improved error handling and debugging information

### 4. SignUpScreen (`app/auth/signup.tsx`)
- Added logging to track the signup process
- Maintained the AsyncStorage logic for storing pending device claims

### 5. Database Cleanup
- Removed test devices (`bb8c7f21`, `cc9d8e42`) that were not created by ESP32 chips
- Removed test user (`test-user-123`)
- Removed all schedules from the database
- Updated initialization script to only include ESP32-created devices

## Database Structure

### ESP32 Devices Only
The database now only contains devices that are actually created by ESP32 chips:
- `ffa4ae30` - Unclaimed ESP32 device
- `45c40a24` - Unclaimed ESP32 device

### Important Notes
- **Device Creation**: Device IDs are created by ESP32 chips, not manually in the app
- **No Schedules**: Scheduling functionality has been removed from the database
- **Real Users Only**: Only users created through the app signup process are stored

## Testing

### Available ESP32 Devices
The following ESP32 devices are available in the Firebase database:
- `ffa4ae30` - Unclaimed ESP32 device
- `45c40a24` - Unclaimed ESP32 device

### Test Flow
1. **Start the app**: Run `npm start` to start the Expo development server
2. **Go to claim device screen**: Navigate to the device claiming screen
3. **Enter device ID**: Use `ffa4ae30` or `45c40a24` (ESP32 devices)
4. **Create account**: Fill in the signup form and create a new account
5. **Verify claiming**: Check the console logs to see the device claiming process
6. **Check result**: The device should be automatically claimed and the user should be redirected to the main app

### Expected Console Logs
```
SignUpScreen - Starting signup process with deviceId: ffa4ae30
SignUpScreen - Stored pending device claim: ffa4ae30
AuthContext - Signup completed, device claiming will be handled by AppRouter
AppRouter - Checking pending device claim: { pendingDeviceId: 'ffa4ae30', ... }
AppRouter - Found pending device claim: ffa4ae30
geyserService - Starting device claim process: { userId: '...', deviceId: 'ffa4ae30', ... }
geyserService - Device claim completed successfully
AppRouter - Device claimed successfully: ffa4ae30
```

## Verification
After successful device claiming:
1. The user's `claimedDeviceId` field should be updated in the database
2. The device's `userId` field should be updated in the database
3. The pending device claim should be cleared from AsyncStorage
4. The user should see their claimed device in the main app

## Error Handling
If device claiming fails:
1. The error is logged but doesn't block the app flow
2. The user can manually claim the device later through the add geyser screen
3. The pending device claim remains in AsyncStorage for retry

## Files Modified
- `app/index.tsx` - Added device claiming logic to AppRouter
- `contexts/AuthContext.tsx` - Removed device claiming from auth functions
- `services/geyserService.ts` - Enhanced logging in claimDevice function
- `app/auth/signup.tsx` - Added logging to signup process
- `scripts/initializeFirebaseData.js` - Updated to only include ESP32 devices
- `scripts/cleanupTestData.js` - New script to remove test data

## Database Cleanup Commands
```bash
# Remove test data
node scripts/cleanupTestData.js

# Initialize ESP32 devices only
node scripts/initializeFirebaseData.js
```
