import { useEffect, useState } from 'react';
import { getValidMoves, colorValid, clearColors, updateCurPositions, startGame, colorSquare, nextPositions, otherPlayerMoves, checkCastle, castling, checkMate } from "@/moves/helperFunctions";
import WindowSizeListener from 'react-window-size-listener';
import { useSnackbar } from 'notistack';
import styles from "../board/Board.module.css";
import { minimaxRoot } from './minimaxRec.js';
import Button from "@mui/material/Button";
import Typography from '@mui/material/Typography';

export default function ComputerBoard({position}) {
  const BOARD_SIZE = 8;
  const SIZE = 70;
  const square = [];
  
  const [curPos, setCurPos] = useState(position);
  const [offset, setOffset] = useState();
  const [valid, setValid] = useState([]);
  
  const [type, setType] = useState();
  const [prevPos, setPrevPos] = useState();
  const [game, setGame] = useState("play");
  
  const [turn, setTurn] = useState(true);
  const [prevOtherPos, setPrevOther] = useState();
  const [curOtherPos, setCurOther] = useState();
  
  const [castle, setCastle] = useState(true);
  const [lCastle, setLCastle] = useState(true);
  const [rCastle, setRCastle] = useState(true);

  const [bCastle, setBCastle] = useState(true);
  const [blCastle, setBLCastle] = useState(true);
  const [brCastle, setBRCastle] = useState(true);

  const [passedMoves, setPassedMoves] = useState({});

  const { enqueueSnackbar } = useSnackbar();

  for (let index = 1; index <= BOARD_SIZE; index++) {
    square.push(index);
  }
  const board = square.map(_ => square);

  useEffect(() => {
    setOffset(document.getElementById("board").getBoundingClientRect());
    startGame(position);
  }, [position])

  const computerMove = () => {
    let move = minimaxRoot(1, curPos, true, bCastle, blCastle, brCastle, passedMoves);
    setPassedMoves(move[1]);
    let piece = move[0][0], prevPos = move[0][2], nextPos = move[0][3];

    let boardCopy = JSON.stringify(curPos);
    boardCopy = JSON.parse(boardCopy);
    boardCopy[nextPos] = piece;
    boardCopy[prevPos] = null;
    let position = otherPlayerMoves(boardCopy, prevPos, nextPos);

    setCurPos(position);
    setPrevOther(prevPos);
    setCurOther(nextPos);
    setTurn(true);

    if (bCastle) {
      let resp = checkCastle(piece, blCastle, brCastle);
      setBCastle(resp[0]);
      if (blCastle) {
        setBLCastle(resp[1])
      }
      if (brCastle) {
        setBRCastle(resp[2])
      } 
      if (!blCastle && !brCastle) {
        setBCastle(false);
      }
    }

    let finished = checkMate("white", position);
    let checkmate = finished[0];
    let winner = finished[1];

    if (checkmate) {
      setGame("End");
      document.getElementById("active").innerHTML = "Status: " +  winner;
    }
  };

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
        let next = "black";
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
        clearColors([prevOtherPos, curOtherPos]);
        setCurPos(updCurPos);
        
        let finished = checkMate(next, curPos);
        let checkmate = finished[0];
        let winner = finished[1];

        if (checkmate) {
          setGame("end");
          document.getElementById("active").innerHTML = "Status: " +  winner;
          return;
        }
        else {
          setTurn(false);
          computerMove();
        }
      }
      else {
        let positions = [prevPos, ...valid];
        let types = curPos[pos];
        if (turn) {
          if (types) {
            if (types[0] === "w") {
              let valid = getValidMoves(types, pos, curPos);
              valid = nextPositions(curPos, valid, "white", pos, types);
              if (types.includes("King")) {
                let mayb = castling(castle, types, curPos, "white", lCastle, rCastle);
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
    }
  }

  return (
    <>
      <WindowSizeListener onResize={() => {
        setOffset(document.getElementById("board").getBoundingClientRect());
      }}>
        <Typography id="active">Status: Active</Typography>
        <Button color="error" size="small" onClick={leaveGame}>Leave</Button>
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