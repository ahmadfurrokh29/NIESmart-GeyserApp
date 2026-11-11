// Authenticated Firebase initialization script
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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
const auth = getAuth(app);

async function initializeDevices() {
  try {
    // First, create an admin user to authenticate with
    console.log('🔐 Creating admin user for initialization...');
    
    const adminEmail = 'admin@smartgeyser.com';
    const adminPassword = 'admin123456';
    
    // Try to sign in with admin credentials
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Signed in as admin');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ Admin user not found. Please create an admin user first through the app.');
        console.log('📝 Steps:');
        console.log('1. Go through the normal signup process in your app');
        console.log('2. Use email: admin@smartgeyser.com');
        console.log('3. Use password: admin123456');
        console.log('4. Then run this script again');
        return;
      }
      throw error;
    }

    const devices = {
      'GYS001': {
        current_Temp: "25",
        target_Temp: 45,
        mode: "electric"
        // No userId - unclaimed device
      },
      'GYS002': {
        current_Temp: "99",
        target_Temp: 30,
        mode: "hybrid",
        userId: 'test-user-123' // Claimed device
      },
      'GYS003': {
        current_Temp: "35",
        target_Temp: 50,
        mode: "gas"
        // No userId - unclaimed device
      }
    };

    // Add sample user for claimed device
    const users = {
      'test-user-123': {
        uid: 'test-user-123',
        email: 'test@example.com',
        phone: '+1234567890',
        displayName: 'Test User',
        claimedDeviceId: 'GYS002'
      }
    };

    // Add sample local device
    const localDevices = {
      'test-user-123': {
        name: 'Test User\'s Geyser',
        status: 'online',
        deviceId: 'GYS002'
      }
    };

    // Add devices
    for (const [deviceId, deviceData] of Object.entries(devices)) {
      await set(ref(database, `DEVICES/${deviceId}`), deviceData);
      console.log(`✅ Added device: ${deviceId}`);
    }

    // Add users
    for (const [userId, userData] of Object.entries(users)) {
      await set(ref(database, `users/${userId}`), userData);
      console.log(`✅ Added user: ${userId}`);
    }

    // Add local devices
    for (const [userId, localDevice] of Object.entries(localDevices)) {
      await set(ref(database, `localDevices/${userId}`), localDevice);
      console.log(`✅ Added local device for user: ${userId}`);
    }

    console.log('✅ Sample data initialized successfully!');
    console.log('\nTest devices:');
    console.log('- GYS001 (unclaimed)');
    console.log('- GYS002 (claimed by test@example.com)');
    console.log('- GYS003 (unclaimed)');
    
    // Sign out
    await auth.signOut();
    console.log('🔐 Signed out');
    
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

initializeDevices();