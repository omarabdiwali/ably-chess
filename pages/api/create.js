import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, position } = req.body;
  const color = Math.random() > 0.5 ? "White" : "Black";
  const query = { code: code };
  const data = { code: code, users: 0, color: [color], position: JSON.stringify(position), turn: "white" };
  let response = "";

  await dbConnect();

  let user = await Rooms.findOne(query).exec();

  if (!user) {
    Rooms.create(data).catch(err => console.error(err));
    response = "Room has been created.";
  }
  
  res.status(200).json({ response: response, color: color, position: position });

}