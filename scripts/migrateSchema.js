// Migration script to normalize DB schema
// - Remove `uid` field from users
// - For each user that has `claimedDeviceId`, set `DEVICES/{deviceId}/userId = <userKey>`

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update, remove } = require('firebase/database');

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

async function migrate() {
  try {
    console.log('🔧 Starting migration: remove users/*/uid and ensure devices/*/userId');

    const usersSnap = await get(ref(database, 'users'));
    if (!usersSnap.exists()) {
      console.log('No users found. Nothing to migrate.');
      process.exit(0);
      return;
    }

    const users = usersSnap.val() || {};
    const updates = {};

    Object.entries(users).forEach(([userKey, userData]) => {
      // Remove nested uid field if present
      if (userData && Object.prototype.hasOwnProperty.call(userData, 'uid')) {
        updates[`users/${userKey}/uid`] = null;
        console.log(`• Will remove users/${userKey}/uid`);
      }

      // If user has claimedDeviceId, ensure the device has userId set
      const claimedDeviceId = userData?.claimedDeviceId;
      if (claimedDeviceId) {
        updates[`DEVICES/${claimedDeviceId}/userId`] = userKey;
        console.log(`• Will set DEVICES/${claimedDeviceId}/userId = ${userKey}`);
      }
    });

    if (Object.keys(updates).length === 0) {
      console.log('No changes needed. Migration complete.');
      process.exit(0);
      return;
    }

    await update(ref(database), updates);

    console.log('✅ Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
