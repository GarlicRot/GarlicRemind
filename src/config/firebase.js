/**
 * -----------------------------------------------------------
 * GarlicRemind - Firebase Configuration
 * -----------------------------------------------------------
 *
 * Description:
 * Initializes and exports a Firestore instance using Firebase
 * Admin SDK, loading credentials from a secure JSON file stored
 * outside of the release directory.
 *
 * Production default:
 *   /opt/discord-bots/garlicremind/shared/creds/firebase.json
 *
 * Optional override:
 *   FIREBASE_CREDENTIALS=/absolute/path/to/firebase.json
 *
 * Usage:
 *   const { db } = require("./config/firebase");
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2026 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const admin = require("firebase-admin");
const fs = require("fs");
const logger = require("../utils/logger");

const DEFAULT_CREDS_PATH =
  "/opt/discord-bots/garlicremind/shared/creds/firebase.json";

const CREDS_PATH = process.env.FIREBASE_CREDENTIALS || DEFAULT_CREDS_PATH;

function safeJsonLoad(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Firebase credentials not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  if (!json || !json.project_id || !json.client_email || !json.private_key) {
    throw new Error(`Invalid Firebase credentials JSON: ${filePath}`);
  }

  return json;
}

try {
  const serviceAccount = safeJsonLoad(CREDS_PATH);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  logger.success("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  logger.error(`❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
  process.exit(1); // let systemd restart instead of running broken
}

const db = admin.firestore();
module.exports = { db };
