import dbConnect from "@/utils/dbConnect";
import Rooms from "@/models/Rooms";

export default async function handler(req, res) {
  const { code, isPublic, position } = req.body;
  const color = Math.random() > 0.5 ? "White" : "Black";
  const query = { code: code };
  const data = { code: code, users: 0, color: [color], position: JSON.stringify(position), turn: "white", public: isPublic };
  let created = true;
  let response = "";

  await dbConnect();

  if (isPublic) {
    let publicQuery = { public: true };
    let publicRoom = await Rooms.findOne(publicQuery).exec();
    response = "Room has been created.";

    if (publicRoom) {
      let color = publicRoom.color.includes("White") ? "Black" : "White";
      publicRoom.public = false;
      created = false;
      publicRoom.save();
      res.status(200).json({ response, code: publicRoom.code, color, position: publicRoom.position, created });
    } else {
      await Rooms.create(data).catch(err => console.error(err));
      res.status(200).json({ response, code, color, position, created });
    }
  } 
  else {
    let user = await Rooms.findOne(query).exec();
    if (!user) {
      await Rooms.create(data).catch(err => console.error(err));
      response = "Room has been created.";
    }
    res.status(200).json({ response, color, position, code, created });
  }
}