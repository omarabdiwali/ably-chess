import dbConnect from "@/utils/api/dbConnect";
import verifyItems from "@/utils/api/verifyItems";
import Rooms from "@/models/Rooms";

const randomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  const { isPublic, position } = req.body;
  if (!verifyItems([isPublic, position], ["boolean", "object"])) {
    console.error("LOG (/api/create): Invalid request:", isPublic, position);
    return res.status(400).json({ response: "Invalid request parameters." });
  }
  
  const color = Math.random() > 0.5 ? "White" : "Black";
  const data = { users: 1, color: [color], position: JSON.stringify(position), turn: "white", public: isPublic };
  let created = true;
  let response = "";

  const createNewRoom = async (retries = 0) => {
    data.code = randomCode();
    try {
      await Rooms.create(data);
      return res.status(200).json({
        response: "Room has been created.",
        code: data.code,
        color,
        position: data.position,
        created
      });
    } catch (err) {
      if (err?.code === 11000 && retries < 5) return createNewRoom(retries + 1);
      console.error(err);
      return res.status(500).json({ response: "Failed to create room" });
    }
  };

  await dbConnect();

  if (isPublic) {
    let publicQuery = { public: true };
    let publicRoom = await Rooms.findOne(publicQuery).exec();
    response = "Room has been created.";

    if (publicRoom) {
      let color = publicRoom.color.includes("White") ? "Black" : "White";
      publicRoom.users += 1;
      publicRoom.color.push(color);
      publicRoom.public = false;
      created = false;
      await publicRoom.save();
      return res.status(200).json({ response, code: publicRoom.code, color, position: publicRoom.position, created });
    } else {
      await createNewRoom();
    }
  } 
  else {
    await createNewRoom();
  }
}