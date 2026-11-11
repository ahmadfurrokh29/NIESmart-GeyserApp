// Cleanup script to remove test data from Firebase
// This removes test devices, test users, and schedules

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, remove } = require('firebase/database');

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

async function cleanupTestData() {
  try {
    console.log('🧹 Starting cleanup of test data...');

    // Remove test devices (not created by ESP32)
    const testDevices = ['bb8c7f21', 'cc9d8e42'];
    for (const deviceId of testDevices) {
      await remove(ref(database, `DEVICES/${deviceId}`));
      console.log(`❌ Removed test device: ${deviceId}`);
    }

    // Remove test user
    await remove(ref(database, `users/test-user-123`));
    console.log('❌ Removed test user: test-user-123');

    // Remove all schedules
    await remove(ref(database, `schedules`));
    console.log('❌ Removed all schedules');

    console.log('\n✅ Cleanup completed successfully!');
    console.log('\nRemaining data:');
    console.log('- ESP32 devices: ffa4ae30, 45c40a24');
    console.log('- Real users (created by app signup)');
    console.log('- No schedules (removed)');
    
    // Close the process
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupTestData();
