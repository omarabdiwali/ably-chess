import { useEffect, useState } from 'react';
import { 
  getValidMoves, colorValid, clearColors, updateCurPositions, startGame, colorSquare, 
  nextPositions, resizeBoard, checkCastle, castling, checkMate, checked, translateMove,
  setEnPassant, clearEnPassant
} from "@/moves/helperFunctions";
import { useSnackbar } from 'notistack';
import { minimaxRoot, posToFen } from '../utils/minimaxRec.js';
import useSound from 'use-sound';
import PromotionModal from './PromotionModal.js';

export default function ComputerBoard({ position, engine }) {
  const BOARD_SIZE = 8;
  const styles = {
    cell: 'w-[70px] h-[70px] inline-block',
    row: 'h-[70px]',
    even: 'bg-[#EED8C0] even',
    odd: 'bg-[#8A5742] odd',
  };
  const square = [];

  const [curPos, setCurPos] = useState(position);
  const [valid, setValid] = useState([]);
  const [totalMoves, setTotalMoves] = useState(0);

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
  const [enPassant, setEP] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [pendingMove, setPendingMove] = useState(null); // { from, to, type, toPiece }

  const [playCheck] = useSound(`${window.location.origin}/sounds/check.mp3`);
  const [playMove] = useSound(`${window.location.origin}/sounds/move-self.mp3`);
  const [playOtherMove] = useSound(`${window.location.origin}/sounds/move-opponent.mp3`);
  const [playPromotion] = useSound(`${window.location.origin}/sounds/promote.mp3`);
  const [playCastle] = useSound(`${window.location.origin}/sounds/castle.mp3`);
  const [playCapture] = useSound(`${window.location.origin}/sounds/capture.mp3`);
  const [playEnd] = useSound(`${window.location.origin}/sounds/game-end.mp3`);

  const { enqueueSnackbar } = useSnackbar();

  for (let index = 1; index <= BOARD_SIZE; index++) {
    square.push(index);
  }
  const board = square.map(_ => square);

  const isWhitePromotionMove = (pieceType, to) => {
    if (!pieceType || !pieceType.includes('Pawn')) return false;
    return to >= 1 && to <= 8;
  };

  const onChoosePromotion = (choice) => {
    if (!pendingMove) return;
    const { from, to, type: fromType, toPiece } = pendingMove;
    let updCurPos = updateCurPositions(fromType, to, curPos, from, false, false, false, null, choice);
    if (toPiece) playCapture(); else playPromotion();

    setEP(null);
    clearEnPassant();
    setValid([]);
    setType("");
    clearColors([from, ...valid]);
    setPrevPos(to);
    clearColors([prevOtherPos, curOtherPos]);
    setTurn(false);

    const finished = checkMate("black", curPos);
    const checkmate = finished[0];
    const winner = finished[1];

    if (checkmate) {
      playEnd();
      setGame("end");
      document.getElementById("active").innerHTML = "Status: " + winner;
    }

    setCurPos(updCurPos);
    setIsPromoting(false);
    setPendingMove(null);
  };

  const cancelPromotion = () => {
    setIsPromoting(false);
    setPendingMove(null);
  };

  useEffect(() => {
    resizeBoard();
    startGame(position);
    setEP(null);
    clearEnPassant();
  }, [resizeBoard, position])

  useEffect(() => {
    window.addEventListener("resize", resizeBoard);
    return () => {
      window.removeEventListener("resize", resizeBoard);
    }
  }, [resizeBoard])

  useEffect(() => {
    if (turn) return;
    computerMove();
  }, [turn])

  const fetchStockfishMove = async () => {
    const fen = posToFen(curPos, "b", totalMoves, rCastle, lCastle, brCastle, blCastle);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify({ fen })
    };

    return await fetch("https://chess-api.com/v1", options)
    .then(res => res.json()).then(data => {
      return data;
    })
  }

/* Replace the manual positionAfter construction in computerMove with updateCurPositions usage */

  const computerMove = async () => {
    let data, piece, prevPosLocal, nextPosLocal, fromPiece, toPiece;

    if (engine === "stockfish") {
      data = await fetchStockfishMove();
      if (data.type && data.type == "error") {
        playEnd();
        setGame("end");
        document.getElementById("active").innerHTML = "Status: White Wins!";
        return;
      }
      prevPosLocal = translateMove(data.fromNumeric);
      nextPosLocal = translateMove(data.toNumeric);
      piece = curPos[prevPosLocal];
      toPiece = curPos[nextPosLocal];
    } else {
      let move = minimaxRoot(1, curPos, true, bCastle, blCastle, brCastle, passedMoves, enPassant);
      if (move == null) {
        playEnd();
        setGame("end");
        document.getElementById("active").innerHTML = "Status: White Wins!";
        return;
      }
      setPassedMoves(move[1]);
      piece = move[0][0]; prevPosLocal = move[0][2]; nextPosLocal = move[0][3];
      fromPiece = curPos[prevPosLocal];
      toPiece = curPos[nextPosLocal];
    }

    colorSquare(prevPosLocal);
    colorSquare(nextPosLocal);

    let enPassantUsed = null;
    if (piece && piece.includes("Pawn") && enPassant && nextPosLocal === enPassant.targetPos && !toPiece) {
      enPassantUsed = enPassant;
    }

    const isCastle = engine === "stockfish"
      ? data.isCastling
      : (fromPiece && fromPiece.includes("King") && Math.abs(nextPosLocal - prevPosLocal) === 2);

    // Determine promotion choice for black (engine), pass to updateCurPositions
    let promotionChoice = null;
    if (engine === "stockfish" && data.promotion) {
      const map = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };
      promotionChoice = map[String(data.promotion).toLowerCase()] || 'Queen';
    }

    // Apply the move using updateCurPositions (handles en passant, castling, promotion)
    const positionAfter = updateCurPositions(
      piece,
      nextPosLocal,
      JSON.parse(JSON.stringify(curPos)),
      prevPosLocal,
      isCastle,
      blCastle, // black left castle flag
      brCastle, // black right castle flag
      enPassantUsed,
      promotionChoice
    );

    // After move sound selection
    const isCapture = engine === "stockfish" ? data.isCapture || !!enPassantUsed : (enPassantUsed ? true : toPiece != null);
    const isPromotion = engine === "stockfish"
      ? !!data.promotion
      : (piece && piece.includes("Pawn") && (nextPosLocal >= 57 && nextPosLocal <= 64));

    if (checked("white", positionAfter)) {
      playCheck();
    } else if (isCastle) {
      playCastle();
    } else if (isPromotion) {
      playPromotion();
    } else if (isCapture) {
      playCapture();
    } else {
      playOtherMove();
    }

    if (castle && (toPiece === "wRook 1" || toPiece === "wRook 2")) {
      const resp = checkCastle(toPiece, lCastle, rCastle);
      setCastle(resp[0]);
      if (lCastle) setLCastle(resp[1]);
      if (rCastle) setRCastle(resp[2]);
      if (!lCastle && !rCastle) setCastle(false);
    }

    setTotalMoves(totalMoves => totalMoves + 1);
    setCurPos(positionAfter);
    setPrevOther(prevPosLocal);
    setCurOther(nextPosLocal);
    setTurn(true);

    if (bCastle) {
      let resp = checkCastle(piece, blCastle, brCastle);
      setBCastle(resp[0]);
      if (blCastle) setBLCastle(resp[1]);
      if (brCastle) setBRCastle(resp[2]);
      if (!blCastle && !brCastle) setBCastle(false);
    }

    let nextEP = null;
    if (piece && piece.includes("Pawn")) {
      const delta = nextPosLocal - prevPosLocal;
      const isBlack = piece[0] === 'b';
      const doublePush = (!isBlack && delta === -16) || (isBlack && delta === 16);
      if (doublePush) {
        const targetPos = isBlack ? (prevPosLocal + 8) : (prevPosLocal - 8);
        const capturablePawnSquare = nextPosLocal;
        nextEP = { targetPos, capturedPos: capturablePawnSquare, color: piece[0] };
      }
    }
    setEP(nextEP);
    if (nextEP) setEnPassant(nextEP); else clearEnPassant();

    let checkmate = false, winner = "";
    if (engine === "stockfish") {
      checkmate = data.mate === -1;
      winner = checkmate ? "Black Wins!" : "";
    } else {
      let finished = checkMate("white", positionAfter);
      checkmate = finished[0];
      winner = finished[1];
    }
    if (checkmate) {
      playEnd();
      setGame("End");
      document.getElementById("active").innerHTML = "Status: " + winner;
    }
  };

  const leaveGame = () => {
    enqueueSnackbar("Goodbye!", { autoHideDuration: 3000, variant: "success" });
    window.location.reload();
  }

  const pieceMovement = (e) => {
    e.preventDefault();
    if (game === "play") {
      let pos = Number(e.target.id);
      let row = Math.floor(pos / 8);
      let col = (pos - (row * 8) - 1);

      if (valid.includes(pos)) {
        const positions = [prevPos, ...valid];
        const next = "black";
        const fromPiece = curPos[prevPos];
        const toPiece = curPos[pos];

        if (isWhitePromotionMove(type, pos)) {
          setIsPromoting(true);
          setPendingMove({ from: prevPos, to: pos, type, toPiece });
          clearColors(positions);
          return;
        }

        let updCurPos;

        let enPassantUsed = null;
        if (type.includes("Pawn") && enPassant && pos === enPassant.targetPos && !toPiece) {
          enPassantUsed = enPassant;
        }

        if (type.includes("King") && castle) {
          updCurPos = updateCurPositions(type, pos, curPos, prevPos, true, lCastle, rCastle, enPassantUsed);
        } else {
          updCurPos = updateCurPositions(type, pos, curPos, prevPos, false, false, false, enPassantUsed);
        }

        if (castle) {
          const resp = checkCastle(type, lCastle, rCastle);
          setCastle(resp[0]);
          if (lCastle) setLCastle(resp[1]);
          if (rCastle) setRCastle(resp[2]);
          if (!lCastle && !rCastle) setCastle(false);
        }

        const isCheckedNow = checked(next, updCurPos);

        if (isCheckedNow) {
          playCheck();
        } else if (fromPiece.includes("King") && Math.abs(pos - prevPos) == 2) {
          playCastle();
        } else if (toPiece || enPassantUsed) {
          playCapture();
        } else {
          playMove();
        }

        if (bCastle && (toPiece == "bRook 1" || toPiece == "bRook 2")) {
          const resp = checkCastle(toPiece, blCastle, brCastle);
          setBCastle(resp[0]);
          if (blCastle) setBLCastle(resp[1])
          if (brCastle) setBRCastle(resp[2])
          if (!blCastle && !brCastle) setBCastle(false)
        }

        setTotalMoves(totalMoves + 1);
        setValid([]);
        setType("");
        clearColors(positions);
        setPrevPos(pos);
        clearColors([prevOtherPos, curOtherPos]);
        setCurPos(updCurPos);

        let nextEP = null;
        if (fromPiece.includes('Pawn')) {
          const delta = pos - prevPos;
          const isWhite = fromPiece[0] === 'w';
          const doublePush = (isWhite && delta === -16) || (!isWhite && delta === 16);
          if (doublePush) {
            const targetPos = isWhite ? (prevPos - 8) : (prevPos + 8);
            const capturablePawnSquare = pos;
            nextEP = { targetPos, capturedPos: capturablePawnSquare, color: fromPiece[0] };
          }
        }
        setEP(nextEP);
        if (nextEP) setEnPassant(nextEP); else clearEnPassant();

        const finished = checkMate(next, curPos);
        const checkmate = finished[0];
        const winner = finished[1];

        if (checkmate) {
          playEnd();
          setGame("end");
          document.getElementById("active").innerHTML = "Status: " + winner;
          return;
        } else {
          setTurn(false);
        }
      }

      else {
        let positions = [prevPos, ...valid];
        let types = curPos[pos];

        if (!turn || !types || types[0] !== "w") return;

        let curValid = getValidMoves(types, pos, curPos, enPassant);
        curValid = nextPositions(curPos, curValid, "white", pos, types, enPassant);
        if (types.includes("King")) {
          let mayb = castling(castle, types, curPos, "white", lCastle, rCastle);
          curValid = curValid.concat(mayb);
        }
        if (curValid.length > 0) {
          setType(types);
          setValid(curValid);
          clearColors(positions);
          colorSquare(pos, col, row);
          colorValid(curValid);
          setPrevPos(pos);
        }
      }
    }
  }

  return (
    <>
      <p id="active" className="text-gray-400">Status: Active</p>
      <button onClick={leaveGame} className='text-red-300 rounded-xl mb-1 px-3 py-1 bg-transparent cursor-pointer hover:text-red-400'>Leave</button>
      <PromotionModal
        open={isPromoting}
        color="white"
        onChoose={onChoosePromotion}
        onCancel={cancelPromotion}
      />
      <div id="board" onClick={e => pieceMovement(e)}>
        {board.map((_, idx) => {
          return (
            <div className={styles.row} key={idx}>
              {square.map((cell, id) => {
                const pos = idx * BOARD_SIZE + cell;
                return (
                  <div className={`${styles.cell} ${(idx + id + 2) % 2 === 0 ? styles.even : styles.odd }`} key={String(pos) + "a"} id={String(pos)}></div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}