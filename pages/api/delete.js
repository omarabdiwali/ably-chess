import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, users, color } = req.body;
  const query = { code: code };

  await dbConnect();
  let user = await Rooms.findOne(query).exec();

  if (user && users === 0) {
    Rooms.findOneAndDelete(query).catch(err => console.error(err));
  }

  else if (users === 1) {
    Rooms.findOne(query).then(room => {
      room.users = 1;
      room.color = color === "White" ? ["Black"] : ["White"];
      room.save();
    }).catch(err => {
      console.error(err);
      res.status(400).json({error: err});
    });
  }

  res.status(200).json({message: "room deleted"});
}