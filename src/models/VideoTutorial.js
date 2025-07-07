import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const videoTutorialSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  durationMinutes: { type: Number },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('VideoTutorial', videoTutorialSchema);
