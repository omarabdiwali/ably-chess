import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, created } = req.body;
  const query = { code: code };
  let color = "";
  let turn = "";
  let position = "";
  let response = "Room has closed / incorrect code.";
  
  await dbConnect();

  try {
    let user = await Rooms.findOne(query).exec();

    if (user.users < 2) {
      if (!created) {
        color = user.color.includes("White") ? "Black" : "White";
        user.color.push(color);
      } else {
        color = user.color[0];
      }

      response = "Joined the room!";

      if (user.users == 0) {
        user.users = 1;
      } else {
        user.users = 2;
      }

      user.save();
      
      position = JSON.parse(user.position);
      turn = user.turn;
      
    } else {
      response = "Room is already full."
    }

    res.status(200).json({ response: response, color: color, turn: turn, position: position });

  } catch (error) {
    res.status(400).json({ response: response })
  }

}