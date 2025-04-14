import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  amount: { type: Number, required: true },
  phoneNumber: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String },
  checkoutRequestId: { type: String },
  merchantRequestId: { type: String },
  resultCode: { type: Number },
  resultDesc: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
paymentSchema.index({ checkoutRequestId: 1 });
paymentSchema.index({ farmerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
