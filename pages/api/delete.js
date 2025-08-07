import dbConnect from "@/utils/api/dbConnect";
import verifyItems from "@/utils/api/verifyItems";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, color } = req.body;
  if (!verifyItems([code, color], ["string", "string"])) {
    console.error("LOG (/api/delete): Invalid request:", code, color);
    return res.status(400).json({ message: "Invalid request parameters. "});
  }
  
  const query = { code: code };
  await dbConnect();
  try {
    let room = await Rooms.findOne(query).exec();
    if (!room) {
      return res.status(400).json({ message: `Room:${code} does not exist!` });
    }

    let users = room.users;
    if (users <= 1) {
      await Rooms.findOneAndDelete(query).catch(err => console.error(err));
    } else if (users == 2) {
      room.users = 1;
      room.color = color === "White" ? ["Black"] : ["White"];
      room.save();
    }

    return res.status(200).json({message: "room deleted"});
  } catch (e) {
    console.error("LOG (/api/delete): Error:", e);
    return res.status(400).json({ message: e.message });
  }
}