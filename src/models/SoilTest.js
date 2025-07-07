import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const soilTestSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  farmId: { type: String, ref: 'Farm', required: true, index: true },
  phLevel: { type: Number, required: true },
  moisturePercent: { type: Number, required: true },
  conductivity: { type: Number },
  temperatureCelsius: { type: Number },
  npkAnalysis: {
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
  },
}, { timestamps: { createdAt: 'testDate', updatedAt: false } });

export default mongoose.model('SoilTest', soilTestSchema);
