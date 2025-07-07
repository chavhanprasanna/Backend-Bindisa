import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Farm from '../src/models/Farm.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Mongo connected – inserting demo data');

    await Farm.deleteMany({});

    await Farm.create([
      {
        _id: uuidv4(),
        ownerId: 'demo-user',
        farmName: 'Demo Farm',
        location: {
          village: 'Pune',
          district: 'Pune',
          state: 'Maharashtra',
          geo: { coordinates: [73.8567, 18.5204] },
        },
        sizeAcres: 12,
        notes: 'Initial demo farm',
      },
      {
        _id: uuidv4(),
        ownerId: 'demo-user',
        farmName: 'Trial Farm',
        location: {
          village: 'Kathmandu',
          district: 'Kathmandu',
          state: 'Bagmati',
          geo: { coordinates: [85.3240, 27.7172] },
        },
        sizeAcres: 20,
        notes: 'Second demo farm',
      },
    ]);

    console.log('Seed data inserted ✔');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
