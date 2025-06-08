/**
 * -----------------------------------------------------------
 * GarlicRemind - Firebase Configuration
 * -----------------------------------------------------------
 *
 * Description:
 * Initializes and exports a Firestore instance using Firebase
 * Admin SDK. Pulls credentials securely from environment variables.
 *
 * Usage:
 * const db = require('./config/firebase');
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const admin = require("firebase-admin");
const logger = require("../utils/logger");

try {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  logger.success("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  logger.error(`❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
}

const db = admin.firestore();
module.exports = { db };
