import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  phoneNumber: { type: String, unique: true, required: true, index: true },
  fullName: { type: String },
  email: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['FARMER', 'AGENT', 'ADMIN'], default: 'FARMER' },
  location: { type: String },
  profilePic: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
