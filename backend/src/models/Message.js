import mongoose from 'mongoose';
import { applyJSON } from '../utils/modelHelpers.js';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    connection: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    messageType: { type: String, enum: ['text'], default: 'text' },
    editedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ connection: 1, createdAt: -1 });
applyJSON(messageSchema);

export const Message = mongoose.model('Message', messageSchema);
