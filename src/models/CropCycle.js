import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const cropCycleSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  farmId: { type: String, ref: 'Farm', index: true },
  cropName: String,
  cropVariety: String,
  plantingDate: Date,
  expectedHarvestDate: Date,
  actualHarvestDate: Date,
  yieldQuantity: Number,
  yieldUnit: String,
  totalRevenue: Number,
  totalCost: Number,
  status: { type: String, enum: ['PLANNED', 'ACTIVE', 'HARVESTED', 'COMPLETED'], default: 'PLANNED' },
}, { timestamps: true });

export default mongoose.model('CropCycle', cropCycleSchema);
