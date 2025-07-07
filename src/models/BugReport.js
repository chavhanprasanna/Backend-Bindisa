import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const bugReportSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  deviceInfo: { type: Schema.Types.Mixed },
  attachmentsUrls: [{ type: String }],
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('BugReport', bugReportSchema);
