import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Board from '../board/Board';
import { fenString } from '@/moves/helperFunctions';
import { useSnackbar } from 'notistack';
import styles from "./Home.module.css";

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';

import ComputerBoard from '../computer/ComputerBoard';

let socket;
const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const positions = fenString(fen);

export default function HomePage() {
  const [room, setRoom] = useState("");
  const [color, setColor] = useState("");
  const [joined, setJoined] = useState(false);
  const [created, setCreated] = useState(false);
  
  const [start, setStart] = useState("end");
  const [position, setPosition] = useState(positions);
  const [turn, setTurn] = useState("");
  const [computer, setComputer] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  const socketInitializer = () => {
    fetch('/api/socket').catch(err => console.log(err));
    socket = io();
  }

  useEffect(() => {
    socketInitializer();
  }, [])

  const onChange = (e) => {
    e.preventDefault();
    let roomVal = e.target.value;
    roomVal = roomVal.replace(/ /i, "");
    setRoom(roomVal);
  }

  const getRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const createRoom = () => {
    let randomCode = getRandomCode();
    let btn = document.getElementById("join");
    let create = document.getElementById("create");
    let input = document.getElementById("input");
    
    create.disabled = true;
    input.readOnly = true;
    btn.disabled = true;

    fetch(`/api/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: randomCode, position: position })
    }).then(res => res.json())
      .then(data => {
      if (data.response === "Room has been created.") {
        setRoom(randomCode);
        setColor(data.color);
        setCreated(true);
        setTurn("white");
        btn.disabled = false;
        setTimeout(() => btn.click(), 500);
      }
      else {
        createRoom();
      }
    }).catch(err => console.error(err))
  }

  const joinRoom = (e) => {
    e.preventDefault();
    if (room === "" || isNaN(parseInt(room)) || room.length !== 6) {
      enqueueSnackbar("Invalid Code", { autoHideDuration: 3000, variant: "error" });
      return;
    }

    let btn = document.getElementById("join");
    let create = document.getElementById("create");
    let input = document.getElementById("input");
    
    create.disabled = true;
    btn.disabled = true;
    input.readOnly = true;

    fetch(`/api/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: room, created: created })
    }).then(res => res.json())
      .then(data => {
        if (data.response === "Joined the room!") {
          let info = JSON.stringify({ room: room, color: created ? color : data.color });
          socket.emit("joinRoom", (info));
          if (!created) {
            setColor(data.color);
            setStart("play");
            setPosition(data.position);
            setTurn(data.turn);
            socket.emit("start");
          }
          setJoined(true); 
          enqueueSnackbar(data.response, { autoHideDuration: 3000, variant: "success" });
        }
        else {
          enqueueSnackbar(data.response, { autoHideDuration: 3000, variant: "error" });
          create.disabled = false;
          btn.disabled = false;
          input.readOnly = false;
        }
    }).catch(err => console.error(err))
  }

  const computerPlay = () => {
    setComputer(true);
    enqueueSnackbar("Joined game!", { autoHideDuration: 3000, variant: "success" });
    setJoined(true);
  }

  return (
    <div>
      {!joined ?
        <center>
          <Card className={styles.card} variant="outlined">
            <CardContent>
              <Typography className={styles.room} style={{ margin: "4%" }} variant="h5" component="h2" gutterBottom>Room code</Typography>
              <form onSubmit={joinRoom}>
                <TextField autoFocus style={{marginTop: "10%"}} variant="outlined" size="small" id="input" value={room} onChange={e => onChange(e)}></TextField>
                <Button style={{ marginLeft: "4%", marginTop: "10.5%" }} variant="contained" color="primary" id="join" onClick={joinRoom}>Join</Button>
              </form>
              <Typography style={{marginTop: "3%"}}>Play with computer:<Button onClick={computerPlay}>Play</Button></Typography>
            </CardContent>
            <CardActions>
              <Typography variant="h6" style={{marginLeft: "3%", marginRight: "3%" }}>Automatically create room: <Button color="primary" id="create" onClick={createRoom}>Create</Button></Typography>
            </CardActions>
          </Card>
        </center>
        : (
          <div className={styles.App}>
            {!computer ? <Board room={room} socket={socket} color={color.toLowerCase()} start={start} position={position} beginning={turn} /> : <ComputerBoard position={position} />}
          </div>
        )}
    </div>
  )
}