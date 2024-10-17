import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  code: String,
  users: Number,
  color: [String],
  position: String,
  turn: String,
  public: Boolean
});

module.exports = mongoose.models.Rooms || mongoose.model("Rooms", RoomSchema);