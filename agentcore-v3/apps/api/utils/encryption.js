const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function _deriveKey() {
  if (!config.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured. Application cannot start.');
  }
  return crypto.createHash('sha256').update(config.ENCRYPTION_KEY).digest();
}

function encrypt(text) {
  try {
    const key = _deriveKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);
    return combined.toString('base64');
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

function decrypt(ciphertext) {
  try {
    const key = _deriveKey();
    const combined = Buffer.from(ciphertext, 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

function hashSecret(secret) {
  try {
    return crypto.createHash('sha256').update(secret).digest('hex');
  } catch (err) {
    throw new Error(`Hashing failed: ${err.message}`);
  }
}

function verifyHmac(payload, signature, secret) {
  try {
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

module.exports = { encrypt, decrypt, hashSecret, verifyHmac };
