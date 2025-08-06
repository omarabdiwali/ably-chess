import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, color } = req.body;
  const query = { code: code };

  await dbConnect();
  try {
    let room = await Rooms.findOne(query).exec();
    if (!room) {
      res.status(400).json({ message: `Room:${code} does not exist!` });
      return;
    }

    let users = room.users;
    if (users <= 1) {
      await Rooms.findOneAndDelete(query).catch(err => console.error(err));
    } else if (users == 2) {
      room.users = 1;
      room.color = color === "White" ? ["Black"] : ["White"];
      room.save();
    }

    res.status(200).json({message: "room deleted"});
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}