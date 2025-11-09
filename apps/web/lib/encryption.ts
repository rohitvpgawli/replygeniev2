import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text - The text to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData (all base64)
 */
export function encrypt(text: string): string {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from encryption key
  const key = deriveKey(encryptionKey, salt);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Return salt:iv:authTag:encryptedData
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

/**
 * Decrypts a string encrypted with the encrypt function
 * @param encryptedText - The encrypted text in format: salt:iv:authTag:encryptedData
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  // Split the encrypted text
  const parts = encryptedText.split(':');
  
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }

  const [saltB64, ivB64, authTagB64, encrypted] = parts;
  
  // Convert from base64
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  
  // Derive key
  const key = deriveKey(encryptionKey, salt);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Safely encrypts a token, returns null if token is null/undefined
 */
export function encryptToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return encrypt(token);
}

/**
 * Safely decrypts a token, returns null if token is null/undefined
 */
export function decryptToken(encryptedToken: string | null | undefined): string | null {
  if (!encryptedToken) return null;
  try {
    return decrypt(encryptedToken);
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return null;
  }
}
