import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const locationSchema = new mongoose.Schema({
  village: String,
  district: String,
  state: String,
  geo: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
}, { _id: false });

const farmSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  ownerId: { type: String, ref: 'User', index: true },
  farmName: { type: String },
  location: locationSchema,
  sizeAcres: Number,
  notes: String,
  cropCycles: [{ type: String, ref: 'CropCycle' }]
}, { timestamps: true });

farmSchema.index({ 'location.geo': '2dsphere' });

export default mongoose.model('Farm', farmSchema);
