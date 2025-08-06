import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code } = req.body;
  const query = { code: code };
  let color = "";
  let turn = "";
  let position = "";
  let response = "Room has closed / incorrect code.";
  
  await dbConnect();

  try {
    let room = await Rooms.findOne(query).exec();

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

    res.status(200).json({ response: response, color: color, turn: turn, position: position });

  } catch (error) {
    // console.log(response);
    res.status(400).json({ response: response })
  }

}