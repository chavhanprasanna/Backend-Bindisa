import dotenv from 'dotenv';
import app from './app.js';
import mongoose from 'mongoose';

// Recommended global settings to avoid deprecation noise and align with Mongoose v8+
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

dotenv.config();
import { ensureJwtSecrets } from './utils/ensureSecrets.js';
ensureJwtSecrets();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
