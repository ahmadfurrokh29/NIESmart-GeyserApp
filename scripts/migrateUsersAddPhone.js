// Migration script to add phone field to existing users
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

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

async function migrateUsers() {
  try {
    console.log('🔄 Starting user migration to add phone field...');
    
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.log('❌ No users found in database');
      return;
    }
    
    const users = snapshot.val();
    let migratedCount = 0;
    
    for (const [userId, userData] of Object.entries(users)) {
      // Check if user already has phone field
      if (!userData.phone) {
        console.log(`📱 Adding phone field to user: ${userData.email}`);
        
        await update(ref(database, `users/${userId}`), {
          phone: '' // Empty string as default, user can update later
        });
        
        migratedCount++;
      } else {
        console.log(`✅ User ${userData.email} already has phone field`);
      }
    }
    
    console.log(`✅ Migration complete! Updated ${migratedCount} users`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateUsers();