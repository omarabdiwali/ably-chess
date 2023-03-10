import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, position, turn } = req.body;
  const query = { code: code };
  const data = { position: JSON.stringify(position), turn: turn };

  await dbConnect();

  Rooms.findOneAndUpdate(query, data).catch(err => console.error(err));
  res.status(200).json({ message: "moved" });
}