# Updated Firebase Realtime Database Rules

Use these rules in your Firebase Console → Realtime Database → Rules:

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
      "$device_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "schedules": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "deviceClaims": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Database Structure Changes

The updated database now includes:

### 1. Enhanced Device Structure
- Added `isOn` field to track geyser on/off status
- Added `lastUpdated` timestamp for device state tracking

### 2. Simplified User Structure (Removed localDevices, claimedDevice object & uid)
```
users/
  {userId}/
    - email: string
    - phone: string
    - displayName: string
    - deviceId: string (direct reference to claimed device)
```

### 3. Enhanced Schedules Structure
```
schedules/
  {userId}/
    {scheduleId}/
      - id: string
      - name: string
      - startTime: string (HH:MM format)
      - offTime: string (HH:MM format)
      - days: array of weekdays
      - temperature: number
      - enabled: boolean
      - mode: string (electric/gas/hybrid)
      - createdAt: timestamp
```

### 4. Profile Settings Updates
- Email and phone fields are now read-only
- Only display name can be edited
- Delete account option removed

### 5. Quick Actions Fix
- "Select Mode" now redirects to proper mode selection page
- No longer redirects to slave device UI

### 6. Database Simplification
- Removed `localDevices` collection
- Device information now stored directly in user profile under `claimedDevice`
- Simplified data structure for better performance and easier maintenance

## Next Steps

1. Update Firebase rules in console
2. Run the updated initialization script
3. Test account creation and profile editing
4. Verify mode selection works correctly