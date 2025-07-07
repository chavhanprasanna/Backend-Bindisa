import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const profitEntrySchema = new Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true, index: true },
  inputDetails: { type: Schema.Types.Mixed, required: true },
  calculatedProfit: { type: Number, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('ProfitEntry', profitEntrySchema);
