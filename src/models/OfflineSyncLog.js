import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const syncLogSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true, index: true },
  syncTimestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], required: true },
  dataSummary: { type: Schema.Types.Mixed }
}, { timestamps: false });

export default mongoose.model('OfflineSyncLog', syncLogSchema);
