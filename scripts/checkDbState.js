const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAlzxu-NAKPpQlkNo-g8U5JRW5mG1K75nU",
  authDomain: "niesmartiotgeyser.firebaseapp.com",
  databaseURL: "https://niesmartiotgeyser-default-rtdb.firebaseio.com",
  projectId: "niesmartiotgeyser",
  storageBucket: "niesmartiotgeyser.firebasestorage.app",
  messagingSenderId: "664269458990",
  appId: "1:664269458990:web:2a0bd9b25ab2e3d72359bf"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...\n');
    
    // Check users
    const usersSnapshot = await get(ref(database, 'users'));
    const users = usersSnapshot.val();
    console.log('👥 Users:');
    if (users) {
      Object.keys(users).forEach(userId => {
        const user = users[userId];
        console.log(`  ${userId}:`, {
          email: user.email,
          displayName: user.displayName,
          claimedDeviceId: user.claimedDeviceId || 'NOT SET',
          deviceId: user.deviceId || 'NOT SET'
        });
      });
    } else {
      console.log('  No users found');
    }
    
    console.log('\n📱 Devices:');
    const devicesSnapshot = await get(ref(database, 'DEVICES'));
    const devices = devicesSnapshot.val();
    if (devices) {
      Object.keys(devices).forEach(deviceId => {
        const device = devices[deviceId];
        console.log(`  ${deviceId}:`, {
          current_Temp: device.current_Temp,
          target_Temp: device.target_Temp,
          mode: device.mode,
          isOn: device.isOn,
          userId: device.userId || 'NOT CLAIMED'
        });
      });
    } else {
      console.log('  No devices found');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseState();
