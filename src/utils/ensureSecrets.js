import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// load env first (don't overwrite process.env)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function generateSecret() {
  return crypto.randomBytes(48).toString('hex');
}

export function ensureJwtSecrets() {
  let updated = false;
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  const map = Object.fromEntries(env.filter(Boolean).map((line) => {
    const [key, ...rest] = line.split('=');
    return [key, rest.join('=')];
  }));

  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.startsWith('your_')) {
    const secret = generateSecret();
    map.JWT_ACCESS_SECRET = secret;
    process.env.JWT_ACCESS_SECRET = secret;
    updated = true;
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.startsWith('your_')) {
    const secret = generateSecret();
    map.JWT_REFRESH_SECRET = secret;
    process.env.JWT_REFRESH_SECRET = secret;
    updated = true;
  }

  if (updated) {
    const lines = Object.entries(map).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('🔐 JWT secrets generated and saved to .env');
  }
}
