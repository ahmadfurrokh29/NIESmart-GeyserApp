// Sample script to initialize Firebase with test device data
// Run this once to add sample devices to your Firebase Realtime Database

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

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

async function initializeDevices() {
  // Only keep devices that are created by ESP32 chips
  // These are the actual device IDs from your ESP32 devices
  const devices = {
    'ffa4ae30': {
      current_Temp: "25",
      target_Temp: 45,
      mode: "electric",
      isOn: false
      // No userId - unclaimed device
    },
    '45c40a24': {
      current_Temp: "32.0625",
      target_Temp: 40,
      mode: "hybrid",
      isOn: false
      // No userId - unclaimed device
    }
  };

  try {
    // Add devices (only ESP32-created devices)
    for (const [deviceId, deviceData] of Object.entries(devices)) {
      await set(ref(database, `DEVICES/${deviceId}`), deviceData);
      console.log(`Added ESP32 device: ${deviceId}`);
    }

    console.log('✅ ESP32 devices initialized successfully!');
    console.log('\nAvailable ESP32 devices:');
    console.log('- ffa4ae30 (unclaimed)');
    console.log('- 45c40a24 (unclaimed)');
    console.log('\nNote: These devices are created by ESP32 chips, not manually.');
    
    // Close the process
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
}

initializeDevices();