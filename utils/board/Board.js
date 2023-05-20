import { useEffect, useState } from 'react';
import { getValidMoves, colorValid, clearColors, updateCurPositions, startGame, colorSquare, nextPositions, checkMate, otherPlayerMoves, checkCastle, castling } from '../../moves/helperFunctions.js';
import WindowSizeListener from 'react-window-size-listener';
import { useSnackbar } from 'notistack';
import styles from "./Board.module.css";
import Button from "@mui/material/Button";
import { Typography } from '@mui/material';

export default function Board({ room, socket, color, start, position, beginning }) {
  const BOARD_SIZE = 8;
  const SIZE = 70;
  const square = [];
  
  const [curPos, setCurPos] = useState(position);
  const [offset, setOffset] = useState();
  const [valid, setValid] = useState([]);
  
  const [type, setType] = useState();
  const [prevPos, setPrevPos] = useState();
  const [game, setGame] = useState(start);
  
  const [turn, setTurn] = useState(color === beginning);
  const [prevOtherPos, setPrevOther] = useState();
  const [curOtherPos, setCurOther] = useState();
  
  const [castle, setCastle] = useState(true);
  const [lCastle, setLCastle] = useState(true);
  const [rCastle, setRCastle] = useState(true);

  const { enqueueSnackbar } = useSnackbar();

  for (let index = 1; index <= BOARD_SIZE; index++) {
    square.push(index);
  }
  const board = square.map(_ => square);

  useEffect(() => {
    setOffset(document.getElementById("board").getBoundingClientRect());
    startGame(position);
  }, [position])

  useEffect(() => {    
    socket.on('pieces', (pieces) => {
      pieces = JSON.parse(pieces);
      let newPos = otherPlayerMoves(pieces.pieces, parseInt(pieces.prev), parseInt(pieces.current));
      setCurPos(newPos);
      setPrevOther(parseInt(pieces.prev));
      setCurOther(parseInt(pieces.current));
      setTurn(true);
    })
    socket.on('delete', () => {
      document.getElementById("active").innerHTML = "Status: Player disconnected.";
      setGame("end");
    })
    socket.on('start', () => {
      setGame("play");
      document.getElementById("active").innerHTML = "Status: Active";
    })
    socket.on('game', (winner) => {
      setGame("end");
      document.getElementById("active").innerHTML = "Status: " +  winner;
    })
  }, [socket])

  const leaveGame = () => {
    enqueueSnackbar("Goodbye!", { autoHideDuration: 3000, variant: "success" });
    setInterval(window.location.reload(), 2000);
  }

  const pieceMovement = (e) => {
    e.preventDefault();
    if (game === "play") {
      let x = Math.ceil((e.pageX - offset.left) / SIZE);
      let y = Math.ceil((e.pageY - offset.top) / SIZE);
      let pos = (y - 1) * 8 + x;
      let row = Math.floor(pos / 8);
      let col = (pos - (row * 8) - 1);

      if (valid.includes(pos)) {
        let positions = [prevPos, ...valid];
        let next = color === "white" ? "black" : "white";
        let updCurPos;

        if (pos % 8 === 0) {
          col = 7;
          row -= 1;
        }
        
        if (type.includes("King") && castle) {
          updCurPos = updateCurPositions(type, row, col, pos, curPos, prevPos, true, lCastle, rCastle);
        }
        else {
          updCurPos = updateCurPositions(type, row, col, pos, curPos, prevPos);
        }
        
        if (castle) {
          let resp = checkCastle(type, lCastle, rCastle);
          setCastle(resp[0]);
          if (lCastle) {
            setLCastle(resp[1])
          }
          if (rCastle) {
            setRCastle(resp[2])
          } 
          if (!lCastle && !rCastle) {
            setCastle(false);
          }
        }
        
        setValid([]);
        setType("");
        clearColors(positions);
        setPrevPos(pos);
        setTurn(false);
        clearColors([prevOtherPos, curOtherPos]);

        socket.emit('pieces', JSON.stringify({ pieces: updCurPos, prev: prevPos, current: pos, turn: next }));

        let finished = checkMate(next, curPos);
        let checkmate = finished[0];
        let winner = finished[1];

        if (checkmate) {
          setGame("end");
          document.getElementById("active").innerHTML = "Status: " +  winner;
          socket.emit('game', (winner));
          return;
        }
      }
      else {
        let positions = [prevPos, ...valid];
        let types = curPos[pos];
        if (!turn || !types) return;

        if (types[0] === color[0]) {
          let valid = getValidMoves(types, pos, curPos);
          valid = nextPositions(curPos, valid, color, pos, types);
          if (types.includes("King")) {
            let mayb = castling(castle, types, curPos, color, lCastle, rCastle);
            valid = valid.concat(mayb);
          }
          if (valid.length > 0) {
            setType(types);
            setValid(valid);
            clearColors(positions);
            colorSquare(pos, col, row);
            colorValid(valid);
            setPrevPos(pos);
          }
        }
      }
    }
  }

  return (
    <>
      <WindowSizeListener onResize={() => {
        setOffset(document.getElementById("board").getBoundingClientRect());
      }}>
        <Typography>Code: {`${room}`}  -  Color: {`${color[0].toUpperCase() + color.substr(1)}`}  -  <span id="active">Status: Active</span></Typography>
        <Button size="small" color="error" onClick={leaveGame}>Leave</Button>
        <div id="board" onClick={e => pieceMovement(e)}>
          {board.map((_, idx) => {
            return (
              <div className={styles.row} key={idx}>
                {square.map((cell, id) => {
                  const pos = idx * BOARD_SIZE + cell;
                  return (
                    <div className={(idx + id + 2) % 2 === 0 ? `${styles.cell} ${styles.even}` : `${styles.cell} ${styles.odd}`} key={String(pos) + "a"} id={String(pos)}></div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </WindowSizeListener>
    </>
  )
}