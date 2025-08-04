import { useEffect, useState, useCallback } from 'react';
import { posToRC, getValidMoves, colorValid, clearColors, updateCurPositions, startGame, colorSquare, nextPositions, checkMate, otherPlayerMoves, checkCastle, castling, checked, setEnPassant, clearEnPassant } from '../../moves/helperFunctions.js';
import { useSnackbar } from 'notistack';
import styles from "./Board.module.css";
import Button from "@mui/material/Button";
import { Typography } from '@mui/material';
import useSound from 'use-sound';

export default function Board({ room, socket, color, start, position, beginning, info }) {
  const BOARD_SIZE = 8;
  const square = [];
  
  const [curPos, setCurPos] = useState(position);
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
  const [cellSize, setCellSize] = useState(1);
  const [enPassant, setEP] = useState(null); // { targetPos, capturedPos, color }
  
  const soundsPath = `${window.location.origin}/sounds`;

  const [playCheck] = useSound(`${soundsPath}/check.mp3`);
  const [playMove] = useSound(`${soundsPath}/move-self.mp3`);
  const [playOtherMove] = useSound(`${soundsPath}/move-opponent.mp3`);
  const [playPromotion] = useSound(`${soundsPath}/promote.mp3`);
  const [playCastle] = useSound(`${soundsPath}/castle.mp3`);
  const [playCapture] = useSound(`${soundsPath}/capture.mp3`);
  const [playEnd] = useSound(`${soundsPath}/game-end.mp3`);

  const { enqueueSnackbar } = useSnackbar();

  for (let index = 1; index <= BOARD_SIZE; index++) {
    square.push(index);
  }

  const changeLayout = useCallback(e => {
    setCellSize(window.innerWidth >= 560 ? 1 : window.innerWidth >= 400 ? 2 : 3);
  })

  useEffect(() => {
    window.__isBlackView = (color === 'black');
  }, [color]);

  useEffect(() => {
    startGame(position);
    setCellSize(window.innerWidth >= 560 ? 1 : window.innerWidth >= 400 ? 2 : 3);
  }, [position])

  useEffect(() => {
    window.addEventListener("resize", changeLayout);
    return () => {
      window.removeEventListener("resize", changeLayout);
    }
  }, [changeLayout])

  useEffect(() => {    
    socket.on('pieces', (pieces) => {
      pieces = JSON.parse(pieces);
      
      let fromPos = parseInt(pieces.prev);
      let toPos = parseInt(pieces.current);
      let newPiece = pieces.pieces[toPos];
      setEP(pieces.enPassant || null);
      setEnPassant(pieces.enPassant || null);

      if (pieces.isChecked) {
        playCheck();
      } else if (pieces.fromPiece.includes("King") && Math.abs(fromPos - toPos) == 2) {
        playCastle();
      } else if (pieces.fromPiece != newPiece) {
        playPromotion();
      } else if (pieces.toPiece || pieces.enPassantUsed) {
        playCapture();
      } else {
        playOtherMove();
      }

      const piece = pieces.pieces[toPos];
      let newPos;

      const isPawn = piece && piece.includes('Pawn');
      const epCtx = pieces.enPassantUsed || null;

      // If opponent used en passant, epCtx will tell us what to remove
      if (epCtx && isPawn && toPos === epCtx.targetPos) {
        const cap = epCtx.capturedPos;
        const temp = { ...pieces.pieces };
        const { row: cr, col: cc } = posToRC(cap, window.__isBlackView);
        const capSq = document.getElementById("board").childNodes.item(`${cr}`).children[cc];
        if (capSq.firstChild) capSq.removeChild(capSq.firstChild);
        temp[cap] = null;

        newPos = updateCurPositions(piece, toPos, temp, fromPos, false, false, false, epCtx);
      } else {
        newPos = otherPlayerMoves(pieces.pieces, fromPos, toPos);
      }

      // Set opponent's new en passant availability they advertise for our next move
      setEP(pieces.nextEnPassant || null);
      setEnPassant(pieces.nextEnPassant || null);

      setCurPos(newPos);
      setPrevOther(fromPos);
      setCurOther(toPos);
      setTurn(true);
    })
    socket.on('delete', () => {
      setGame("end");
      document.getElementById("active").innerHTML = "Status: Player disconnected.";
    })
    socket.on('start', () => {
      setGame("play");
      document.getElementById("active").innerHTML = "Status: Active";
    })
    socket.on('game', (winner) => {
      playEnd();
      setGame("end");
      document.getElementById("active").innerHTML = "Status: " +  winner;
    })
  }, [socket, playCapture, playCastle, playCheck, playEnd, playOtherMove, playPromotion])

  const leaveGame = () => {
    enqueueSnackbar("Goodbye!", { autoHideDuration: 3000, variant: "success" });
    setInterval(window.location.reload(), 2000);
  }

const pieceMovement = (e) => {
  e.preventDefault();
  if (game === "play") {
    const pos = Number(e.target.id);

    if (valid.includes(pos)) {
      const positions = [prevPos, ...valid];
      const next = color === "white" ? "black" : "white";
      const fromPiece = curPos[prevPos];
      const toPiece = curPos[pos];
      let updCurPos;

      if (type.includes("King") && castle) {
        updCurPos = updateCurPositions(type, pos, curPos, prevPos, true, lCastle, rCastle);
      } else {
        updCurPos = updateCurPositions(type, pos, curPos, prevPos);
      }

      if (castle) {
        const resp = checkCastle(type, lCastle, rCastle);
        setCastle(resp[0]);
        if (lCastle) setLCastle(resp[1]);
        if (rCastle) setRCastle(resp[2]);
        if (!lCastle && !rCastle) setCastle(false);
      }

      const newPiece = updCurPos[pos];
      const isChecked = checked(next, updCurPos);

      if (isChecked) {
        playCheck();
      } else if (fromPiece.includes("King") && Math.abs(pos - prevPos) == 2) {
        playCastle();
      } else if (fromPiece != newPiece) {
        playPromotion();
      } else if (toPiece) {
        playCapture();
      } else {
        playMove();
      }

      let enPassantUsed = null; // if we just captured en passant
      let nextEnPassant = null; // if our move creates en passant for opponent

      if (type.includes('Pawn')) {
        const delta = pos - prevPos;
        const isWhite = type[0] === 'w';
        const doublePush = (isWhite && delta === -16) || (!isWhite && delta === 16);
        if (doublePush) {
          const targetPos = isWhite ? (prevPos - 8) : (prevPos + 8);
          nextEnPassant = { targetPos, capturedPos: pos, color: type[0] }; 
        }

        if (enPassant && pos === enPassant.targetPos) {
          enPassantUsed = enPassant;
          updCurPos = updateCurPositions(type, pos, updCurPos, prevPos, false, false, false, enPassantUsed);
        }
      }

      // After making a move, if we didn't use EP, clear current EP; only nextEnPassant survives to opponent
      if (!enPassantUsed) {
        setEP(null);
        clearEnPassant();
      } else {
        // Else, consume it
        setEP(null);
        clearEnPassant();
      }

      // Set next EP context for opponent both locally and in helper
      if (nextEnPassant) {
        setEP(nextEnPassant);
        setEnPassant(nextEnPassant);
      } else {
        setEP(null);
        setEnPassant(null);
      }

      setValid([]);
      setType("");
      clearColors(positions);
      setPrevPos(pos);
      setTurn(false);
      clearColors([prevOtherPos, curOtherPos]);

      socket.emit('pieces', JSON.stringify({
        pieces: updCurPos,
        fromPiece,
        toPiece,
        prev: prevPos,
        current: pos,
        isChecked,
        turn: next,
        enPassantUsed,
        nextEnPassant
      }));


      const finished = checkMate(next, curPos);
      const checkmate = finished[0];
      const winner = finished[1];

      if (checkmate) {
        playEnd();
        setGame("end");
        document.getElementById("active").innerHTML = "Status: " + winner;
        socket.emit('game', (winner));
        return;
      }
    } else {
      const positions = [prevPos, ...valid];
      const types = curPos[pos];

      if (!turn || !types || types[0] !== color[0]) return;

      let curValid = getValidMoves(types, pos, curPos);
      curValid = nextPositions(curPos, curValid, color, pos, types, enPassant);


      if (types.includes("King")) {
        const mayb = castling(castle, types, curPos, color, lCastle, rCastle);
        curValid = curValid.concat(mayb);
      }

      if (curValid.length > 0) {
        setType(types);
        setValid(curValid);
        clearColors(positions);
        colorSquare(pos);
        colorValid(curValid);
        setPrevPos(pos);
      }
    }
  }
}

  return (
    <>
      <Typography>Code: {`${room}`}  -  Color: {`${color[0].toUpperCase() + color.substr(1)}`}  -  <span id="active">{info}</span></Typography>
      <Button size="small" color="error" onClick={leaveGame}>Leave</Button>
      <div id="board" onClick={e => pieceMovement(e)}>
        {Array.from({ length: BOARD_SIZE }).map((_, r) => {
          const uiRow = (color === 'black') ? (BOARD_SIZE - 1 - r) : r;
          return (
            <div className={cellSize == 1 ? styles.row : cellSize == 2 ? styles.smRow : styles.xsRow} key={uiRow}>
              {Array.from({ length: BOARD_SIZE }).map((_, c) => {
                const uiCol = (color === 'black') ? (BOARD_SIZE - 1 - c) : c;
                const pos = uiRow * BOARD_SIZE + (uiCol + 1);
                return (
                  <div
                    className={`${cellSize == 1 ? styles.cell : cellSize == 2 ? styles.smCell : styles.xsCell} ${(uiRow + uiCol + 2) % 2 === 0 ? styles.even : styles.odd }`}
                    key={String(pos) + "a"}
                    id={String(pos)}
                  />
                )
              })}
            </div>
          )
        })}
    </div>
    </>
  )
}