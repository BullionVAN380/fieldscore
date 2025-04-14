import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  county: {
    type: String,
    required: true,
  },
  ward: {
    type: String,
    required: true,
  },
  crop: {
    type: String,
    enum: ['Maize', 'Beans', 'Sorghum', 'Green grams', 'Cowpeas', 'Millet'],
    required: true,
  },
  acres: {
    type: Number,
    required: true,
    min: 0,
  },
  premium: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Farmer = mongoose.model('Farmer', farmerSchema);
