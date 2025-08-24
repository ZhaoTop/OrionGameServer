import { Schema, model } from 'mongoose';
import { IUser } from '@/common/interfaces';

const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    type: String,
    minlength: 8,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  deviceId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  isGuest: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  collection: 'users',
  versionKey: false,
});

// Indexes for performance
userSchema.index({ createdAt: 1 });
userSchema.index({ isGuest: 1 });
userSchema.index({ username: 1, isGuest: 1 });

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password; // Never return password in JSON
  return obj;
};

// Static methods
userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username, isGuest: false });
};

userSchema.statics.findByDeviceId = function(deviceId: string) {
  return this.findOne({ deviceId, isGuest: true });
};

userSchema.statics.isUsernameAvailable = async function(username: string) {
  const user = await this.findOne({ username });
  return !user;
};

export const UserModel = model<IUser>('User', userSchema);