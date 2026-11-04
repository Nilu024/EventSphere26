// Builds/updates all indexes declared in the Mongoose models. Usage: npm run db:indexes
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import '../src/models/User.js';
import '../src/models/Event.js';
import '../src/models/Session.js';
import '../src/models/Speaker.js';
import '../src/models/EventRegistration.js';
import '../src/models/Connection.js';
import '../src/models/Message.js';
import '../src/models/Question.js';
import '../src/models/NetworkingSession.js';
import '../src/models/Notification.js';
import '../src/models/Attendance.js';

await connectDB();
for (const model of Object.values(mongoose.models)) {
  await model.syncIndexes();
  console.log(`indexes synced: ${model.collection.name}`);
}
await mongoose.disconnect();
