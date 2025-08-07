import dbConnect from "@/utils/api/dbConnect";
import verifyItems from "@/utils/api/verifyItems";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, position, turn } = req.body;
  if (!verifyItems([code, position, turn], ["string", "object", "string"])) {
    console.error("LOG (/api/move): Invalid request:", code, position, turn);
    return res.status(400).json({ message: "Invalid request parameters. "});
  }
  const query = { code: code };
  const data = { position: JSON.stringify(position), turn: turn };

  await dbConnect();

  const room = await Rooms.findOneAndUpdate(query, data).catch(err => console.error(err));
  if (!room) {
    return res.status(200).json({ message: `Room:${code} does not exist!`});
  } else {
    return res.status(200).json({ message: "moved" });
  }
}