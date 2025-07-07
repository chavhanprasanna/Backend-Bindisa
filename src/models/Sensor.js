import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const sensorSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  farmId: { type: String, ref: 'Farm', index: true },
  sensorType: { type: String, enum: ['SOIL_MOISTURE', 'PH', 'NPK', 'WEATHER'] },
  sensorModel: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
  lastSeen: Date,
}, { timestamps: true });

export default mongoose.model('Sensor', sensorSchema);
