import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { PHONE_REGEX } from '../config/otp.config.js';

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
      validate: {
        validator: function(v) {
          return PHONE_REGEX.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    fullName: {
      type: String,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot be longer than 100 characters']
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    profilePic: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    fcmTokens: [{
      token: String,
      device: String,
      lastUsed: Date
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.fcmTokens;
        delete ret.__v;
        return ret;
      }
    }
  }
);


// Pre-save hook to hash password if modified
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login timestamp
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find by phone number
userSchema.statics.findByPhone = async function(phoneNumber) {
  return this.findOne({ phoneNumber });
};

// Static method to find by email
userSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;
