import mongoose from 'mongoose';

export const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
export const idStr = (v) => (v && v._id ? v._id.toString() : v ? v.toString() : v);
export const sameId = (a, b) => idStr(a) === idStr(b);
