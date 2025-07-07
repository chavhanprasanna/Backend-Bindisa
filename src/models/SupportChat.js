import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const messageSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  senderId: { type: String, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const supportChatSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true, index: true },
  agentId: { type: String, ref: 'User' },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  messages: { type: [messageSchema], default: [] },
  lastMessageAt: { type: Date },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('SupportChat', supportChatSchema);
