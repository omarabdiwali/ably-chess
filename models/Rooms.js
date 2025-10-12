import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  users: Number,
  color: [String],
  position: String,
  turn: String,
  public: Boolean,
}, { timestamps: true });

RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 1800 });
module.exports = mongoose.models.Rooms || mongoose.model("Rooms", RoomSchema);