import mongoose from "mongoose";
import Rooms from "../../models/Rooms.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Error connecting to the database.")
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(async mongoose => {
      try {
        await Rooms.syncIndexes();
      } catch (err) {
        console.error(err);
      }
      return mongoose;
    })
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;