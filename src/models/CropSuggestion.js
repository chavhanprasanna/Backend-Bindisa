import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const cropSuggestionSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true, index: true },
  requestDetails: { type: Schema.Types.Mixed, required: true },
  recommendedCrops: { type: [Schema.Types.Mixed], required: true },
  cropRotationPlan: { type: [Schema.Types.Mixed] }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('CropSuggestion', cropSuggestionSchema);
