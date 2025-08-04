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
import CardContent from '@mui/material/CardContent';
import ComputerBoard from '../computer/ComputerBoard';
import CircularProgress from '@mui/material/CircularProgress';

let socket;
const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const positions = fenString(fen);

export default function HomePage() {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [computer, setComputer] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [engine, setEngine] = useState(null);
 
  const [turn, setTurn] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState("");
  const [start, setStart] = useState("end");
  const [info, setInfo] = useState("Status: Active");
  const [position, setPosition] = useState(positions);
  
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

  const createRoom = (e, isPublic=false, retries=0) => {
    e.preventDefault();
    setLoading(true);
    setDisabled(true);
    let randomCode = getRandomCode();

    fetch(`/api/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: randomCode, isPublic: isPublic, position: position })
    }).then(res => res.json())
      .then(data => {
        if (data.response === "Room has been created.") {
          setRoom(data.code);
          setColor(data.color);
          setCreated(data.created);
          setTurn("white");
          joinRoom(e, data.code, data.color, data.created);
        }
        else {
          if (retries < 3) {
            createRoom(e, isPublic, retries + 1);
          }
          else {
            enqueueSnackbar("Error creating a room!", { autoHideDuration: 3000, variant: "error" });
            setLoading(false);
            setDisabled(false);
          }
        }
      }).catch(err => console.error(err))
  }

  const joinRoom = (e, dataCode=null, dataColor=null, dataCreated=null) => {
    e.preventDefault();
    let roomCode = dataCode ?? room;
    let playerColor = dataColor ?? color;
    let playerCreated = dataCreated ?? created;

    if (roomCode === "" || isNaN(parseInt(roomCode)) || roomCode.length !== 6) {
      enqueueSnackbar("Invalid Code", { autoHideDuration: 3000, variant: "error" });
      setDisabled(false);
      setLoading(false);
      return;
    }

    setDisabled(true);
    setLoading(true);

    fetch(`/api/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: roomCode, created: playerCreated })
    }).then(res => res.json())
      .then(data => {
        if (data.response === "Joined the room!") {
          let info = JSON.stringify({ room: roomCode, color: playerCreated ? playerColor : data.color });
          socket.emit("joinRoom", (info));
          if (!playerCreated) {
            setColor(data.color);
            setStart("play");
            setPosition(data.position);
            setTurn(data.turn);
            socket.emit("start");
          } else {
            setInfo("Status: Waiting for player...");
          }
          setJoined(true);
          setLoading(false);
          enqueueSnackbar(data.response, { autoHideDuration: 3000, variant: "success" });
        }
        else {
          enqueueSnackbar(data.response, { autoHideDuration: 3000, variant: "error" });
          setDisabled(false);
          setLoading(false);
        }
    }).catch(err => console.error(err))
  }

  const computerPlay = () => {
    setComputer(true);
    setJoined(true);
  }

  return (
    <div>
      {!joined ?
        <center>
          <Card className={styles.card} variant="outlined">
            <CardContent>
              {!loading ? (
                <div>
                  <Typography className={styles.room} style={{ margin: "4%" }} variant="h5" component="h2" gutterBottom>Room code</Typography>
                  <form onSubmit={joinRoom}>
                    <TextField disabled={disabled} autoFocus style={{marginTop: "10%"}} variant="outlined" size="small" id="input" value={room} onChange={e => onChange(e)}></TextField>
                    <Button disabled={disabled} style={{ marginLeft: "4%", marginTop: "10.5%" }} variant="contained" color="primary" id="join" onClick={joinRoom}>Join</Button>
                  </form>
                  <Button disabled={disabled} style={{marginTop: "7%"}} color="primary" id="create" onClick={createRoom}>Create Room</Button>
                  <Button disabled={disabled} style={{marginTop: "7%"}} onClick={(e) => createRoom(e, true)}>Public Play</Button>
                  <Typography style={{marginTop: "4%"}}>Play with computer:<Button disabled={disabled} onClick={computerPlay}>Play</Button></Typography>
                </div>
              ) : <center><CircularProgress /></center>}
            </CardContent>
          </Card>
        </center>
        : (
          <div className={styles.App}>
            {!computer ? 
            <Board room={room} socket={socket} color={color.toLowerCase()} start={start} position={position} beginning={turn} info={info} /> : 
            !engine ? 
            <center>
              <Card className={styles.card} variant="outlined">
                <CardContent>
                  <div>
                    <Typography className={styles.room} style={{ margin: "4%"}} variant="h5" component="h2" gutterBottom>Select Chess Engine</Typography>
                    <Button style={{marginTop: "7%"}} color='primary' onClick={() => setEngine("custom")}>Custom Engine (easy)</Button>
                    <br></br>
                    <Button style={{marginTop: "7%"}} color='primary' onClick={() => setEngine("stockfish")}>Stockfish</Button>
                  </div>
                </CardContent>
              </Card>
            </center> : <ComputerBoard engine={engine} position={position} />
            }
          </div>
        )}
    </div>
  )
}