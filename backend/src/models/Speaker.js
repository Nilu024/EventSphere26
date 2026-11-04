import mongoose from 'mongoose';
import { applyJSON } from '../utils/modelHelpers.js';

const link = { type: String, trim: true, maxlength: 300 };

const speakerSchema = new mongoose.Schema(
  {
    // Design decision: the spec's Speaker model has no event field, but speakers are managed per event
    // (/events/:eventId/speakers), so each speaker profile belongs to exactly one event.
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    designation: { type: String, trim: true, maxlength: 100 },
    organization: { type: String, trim: true, maxlength: 100 },
    biography: { type: String, trim: true, maxlength: 3000 },
    profileImage: { type: String, trim: true },
    expertise: { type: [String], default: [] },
    socialLinks: { type: new mongoose.Schema({ linkedin: link, github: link, twitter: link, website: link }, { _id: false }), default: () => ({}) },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

speakerSchema.index({ event: 1, name: 1 });
applyJSON(speakerSchema);

export const Speaker = mongoose.model('Speaker', speakerSchema);
