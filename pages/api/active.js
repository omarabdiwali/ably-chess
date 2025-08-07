import dbConnect from "@/utils/api/dbConnect";
import verifyItems from "@/utils/api/verifyItems";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code } = req.body;
  if (!verifyItems([code], ["string"])) {
    console.error("LOG (/api/active): Invalid request:", code);
    return res.status(400).json({ response: "Invalid request parameters." });
  }
  
  const query = { code: code };
  let color = "";
  let turn = "";
  let position = "";
  let response = "Room has closed / incorrect code.";
  
  await dbConnect();

  try {
    let room = await Rooms.findOne(query).exec();
    if (!room) {
      return res.status(400).json({ response });
    }

    if (room.users < 2) {
      color = room.color.includes("White") ? "Black" : "White";
      room.color.push(color);
      response = "Joined the room!";
      room.users = 2;

      if (room.public) {
        room.public = false;
      }

      room.save();
      position = JSON.parse(room.position);
      turn = room.turn;
      
    } else {
      response = "Room is already full."
    }

    return res.status(200).json({ response, color, turn, position });
  } catch (error) {
    return res.status(400).json({ response })
  }
}