import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const aiRecommendationSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  farmId: { type: String, ref: 'Farm', required: true, index: true },
  triggeringTest: { type: String, ref: 'SoilTest' },
  type: { type: String, enum: ['SOIL_FERTILITY', 'WARNING'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  actionRequired: { type: String }
}, { timestamps: true });

export default mongoose.model('AIRecommendation', aiRecommendationSchema);
