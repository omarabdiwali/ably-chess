import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getValidMoves,
  colorValid,
  clearColors,
  updateCurPositions,
  startGame,
  colorSquare,
  nextPositions,
  checkMate,
  otherPlayerMoves,
  checkCastle,
  castling,
  checked,
  setEnPassant,
  clearEnPassant,
  clearSquare,
  capitalize,
} from '../../moves/helperFunctions.js';
import { useSnackbar } from 'notistack';
import styles from "./Board.module.css";
import Button from "@mui/material/Button";
import { Typography } from '@mui/material';
import useSound from 'use-sound';
import PromotionModal from '../components/PromotionModal.js';
import { useAbly } from '../ably/AblyProvider';

export default function Board({ room, color, start, position, beginning, info }) {
  const BOARD_SIZE = 8;

  // Game state
  const [curPos, setCurPos] = useState(position);
  const [valid, setValid] = useState([]);
  const [type, setType] = useState();
  const [prevPos, setPrevPos] = useState();
  const [game, setGame] = useState(start); // 'play' | 'end'
  const [turn, setTurn] = useState(color === beginning);
  const [prevOtherPos, setPrevOther] = useState();
  const [curOtherPos, setCurOther] = useState();
  const [castle, setCastle] = useState(true);
  const [lCastle, setLCastle] = useState(true);
  const [rCastle, setRCastle] = useState(true);
  const [cellSize, setCellSize] = useState(1);
  const [enPassant, setEP] = useState(null); // { targetPos, capturedPos, color }
  const [isPromoting, setIsPromoting] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [statusText, setStatusText] = useState(info || 'Status: White Turn');

  const soundsPath = `${typeof window !== 'undefined' ? window.location.origin : ''}/sounds`;
  const [playCheck] = useSound(`${soundsPath}/check.mp3`);
  const [playMove] = useSound(`${soundsPath}/move-self.mp3`);
  const [playOtherMove] = useSound(`${soundsPath}/move-opponent.mp3`);
  const [playPromotion] = useSound(`${soundsPath}/promote.mp3`);
  const [playCastle] = useSound(`${soundsPath}/castle.mp3`);
  const [playCapture] = useSound(`${soundsPath}/capture.mp3`);
  const [playEnd] = useSound(`${soundsPath}/game-end.mp3`);

  const { enqueueSnackbar } = useSnackbar();
  const { getChannel, ensureAttached, safePublish } = useAbly();

  // Ably
  const channelRef = useRef(null);

  useEffect(() => {
    window.__isBlackView = (color === 'black');
  }, [color]);

  // Initial board setup
  useEffect(() => {
    startGame(position);
    if (typeof window !== 'undefined') {
      setCellSize(window.innerWidth >= 560 ? 1 : window.innerWidth >= 400 ? 2 : 3);
      window.__isBlackView = (color === 'black');
    }
  }, [position, color]);

  const onResize = useCallback(() => {
    setCellSize(window.innerWidth >= 560 ? 1 : window.innerWidth >= 400 ? 2 : 3);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); };
  }, [onResize]);

  // Channel setup and subscriptions
  useEffect(() => {
    let cancelled = false;
    let unsubscribed = false;

    const setup = async () => {
      const ch = await getChannel(room);
      if (!ch) return;
      channelRef.current = ch;
      try { await ensureAttached(ch); } catch {}
      try { await ch.presence.enter({ color }).catch(() => {}); } catch {}

      const onPieces = (msg) => {
        if (cancelled) return;
        if (game !== 'play') return;
        const pieces = msg.data;

        let fromPos = parseInt(pieces.prev);
        let toPos = parseInt(pieces.current);

        setEP(pieces.enPassant || null);
        setEnPassant(pieces.enPassant || null);

        if (pieces.isChecked) {
          playCheck();
        } else if (pieces.fromPiece?.includes('King') && Math.abs(fromPos - toPos) === 2) {
          playCastle();
        } else if (pieces.promotionChoice) {
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

        if (epCtx && isPawn && toPos === epCtx.targetPos) {
          const cap = epCtx.capturedPos;
          const temp = { ...pieces.pieces };
          clearSquare(cap);
          temp[cap] = null;
          newPos = updateCurPositions(piece, toPos, temp, fromPos, false, false, false, epCtx, pieces.promotionChoice || null);
        } else {
          newPos = otherPlayerMoves(pieces.pieces, fromPos, toPos);
        }

        const status = capitalize(color, 'Active');
        setEP(pieces.nextEnPassant || null);
        setEnPassant(pieces.nextEnPassant || null);
        setCurPos(newPos);
        setPrevOther(fromPos);
        setCurOther(toPos);
        setTurn(true);
        setStatusText(`Status: ${status !== 'Active' ? `${status} Turn` : status}`);
      };

      const onStart = (msg) => {
        if (cancelled) return;
        const status = capitalize(msg.data?.turn, 'Active');
        setGame('play');
        setStatusText(`Status: ${status !== 'Active' ? `${status} Turn` : status}`);
      };

      const onGameEnd = (msg) => {
        if (cancelled) return;
        playEnd();
        setGame('end');
        setStatusText(`Status: ${msg.data}`);
      };

      const onDelete = (msg) => {
        if (cancelled) return;
        setGame('end');
        setStatusText(`Status: Player disconnected`);
      }

      ch.subscribe('pieces', onPieces);
      ch.subscribe('start', onStart);
      ch.subscribe('game', onGameEnd);
      ch.subscribe('delete', onDelete);

      return () => {
        if (unsubscribed) return;
        unsubscribed = true;
        try {
          ch.unsubscribe('pieces', onPieces);
          ch.unsubscribe('start', onStart);
          ch.unsubscribe('game', onGameEnd);
          ch.unsubscribe('delete', onDelete);
        } catch {}
        try { ch.presence.leave({ color }).catch(() => {}); } catch {}
      };
    };

    let cleanup;
    setup().then((c) => { cleanup = c; });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [room, color, ensureAttached, getChannel, playCapture, playCastle, playCheck, playEnd, playOtherMove, playPromotion, enqueueSnackbar, game]);

  // Publishing helpers ------------------------------------------------------------------

  const leaveGame = async (message, variant) => {
    const payload = { room, color, at: Date.now() };
    enqueueSnackbar(message, { autoHideDuration: 3000, variant });
    await safePublish(room, 'delete', payload);
    setTimeout(window.location.reload(), 2000);
  };

  const publishPieces = useCallback(async (payload) => {
    const next = color === 'white' ? 'black' : 'white';
    const resp = await fetch(`/api/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: room, position: payload.pieces, turn: next })
    }).catch(() => {});
    const data = await resp.json();

    if (data.message === 'moved') {
      try { await safePublish(room, 'pieces', payload); } catch {}
    } else {
      await leaveGame(data.message, 'error');
    }
  }, [color, room, safePublish, leaveGame]);

  const publishGame = useCallback(async (winner) => {
    try { await safePublish(room, 'game', winner); } catch {}
  }, [safePublish, room]);

  // Promotion flow ----------------------------------------------------------------------

  const isPromotionMove = (pieceType, _, to) => {
    if (!pieceType || !pieceType.includes('Pawn')) return false;
    const isWhite = pieceType[0] === 'w';
    return (isWhite && (to >= 1 && to <= 8)) || (!isWhite && (to >= 57 && to <= 64));
  };

  const onChoosePromotion = (choice) => {
    if (!pendingMove || game !== 'play') return;
    const { from, to, type: fromType, toPiece } = pendingMove;

    const next = color === 'white' ? 'black' : 'white';
    let updCurPos = updateCurPositions(fromType, to, curPos, from, false, false, false, null, choice);

    if (toPiece) playCapture(); else playPromotion();

    setEP(null);
    clearEnPassant();

    setValid([]);
    setType('');
    clearColors([from, ...valid]);
    setPrevPos(to);
    setTurn(false);
    clearColors([prevOtherPos, curOtherPos]);

    const payload = {
      pieces: updCurPos,
      fromPiece: fromType,
      toPiece,
      prev: from,
      current: to,
      isChecked: checked(next, updCurPos),
      turn: next,
      enPassantUsed: null,
      nextEnPassant: null,
      promotionChoice: choice
    };

    publishPieces(payload);

    const finished = checkMate(next, curPos);
    const checkmate = finished[0];
    const winner = finished[1];

    if (checkmate) {
      playEnd();
      setGame('end');
      setStatusText(`Status: ${winner}`);
      publishGame(winner);
    }

    setCurPos(updCurPos);
    setIsPromoting(false);
    setPendingMove(null);
  };

  const cancelPromotion = () => {
    setIsPromoting(false);
    setPendingMove(null);
  };

  // Interaction -------------------------------------------------------------------------

  const pieceMovement = (e) => {
    e.preventDefault();
    if (game !== 'play') return;

    const pos = Number(e.target.id);
    if (!pos) return;

    if (valid.includes(pos)) {
      const positions = [prevPos, ...valid];
      const next = color === 'white' ? 'black' : 'white';
      const fromPiece = curPos[prevPos];
      const toPiece = curPos[pos];

      if (isPromotionMove(type, prevPos, pos)) {
        setIsPromoting(true);
        setPendingMove({ from: prevPos, to: pos, type, toPiece });
        clearColors(positions);
        return;
      }

      let updCurPos;
      if (type.includes('King') && castle) {
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
      } else if (fromPiece.includes('King') && Math.abs(pos - prevPos) === 2) {
        playCastle();
      } else if (fromPiece !== newPiece) {
        playPromotion();
      } else if (toPiece) {
        playCapture();
      } else {
        playMove();
      }

      let enPassantUsed = null;
      let nextEnPassant = null;

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

      setEP(nextEnPassant || null);
      setEnPassant(nextEnPassant || null);

      setValid([]);
      setType('');
      clearColors(positions);
      setPrevPos(pos);
      setTurn(false);
      clearColors([prevOtherPos, curOtherPos]);

      const payload = {
        pieces: updCurPos,
        fromPiece,
        toPiece,
        prev: prevPos,
        current: pos,
        isChecked,
        turn: next,
        enPassantUsed,
        nextEnPassant,
        promotionChoice: null
      };

      publishPieces(payload);

      const finished = checkMate(next, curPos);
      if (finished[0]) {
        const winner = finished[1];
        playEnd();
        setGame('end');
        setStatusText(`Status: ${winner}`);
        publishGame(winner);
        return;
      } else {
        const status = capitalize(next, 'Active');
        setStatusText(`Status: ${status !== 'Active' ? `${status} Turn` : status}`)
      }

      setCurPos(updCurPos);
    } else {
      const positions = [prevPos, ...valid];
      const types = curPos[pos];
      if (!turn || !types || types[0] !== color[0]) return;

      let curValid = getValidMoves(types, pos, curPos);
      curValid = nextPositions(curPos, curValid, color, pos, types, enPassant);

      if (types.includes('King')) {
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
  };

  // Render ------------------------------------------------------------------------------
  return (
    <>
      <Typography>Code: {room}  -  Color: {capitalize(color)}  -  <span id="active">{statusText}</span></Typography>
      <Button size="small" color="error" onClick={async () => { leaveGame("Leaving game...", "info") }}>Leave</Button>
      <PromotionModal
        open={isPromoting}
        color={color}
        onChoose={onChoosePromotion}
        onCancel={cancelPromotion}
      />
      <div id="board" onClick={pieceMovement}>
        {Array.from({ length: BOARD_SIZE }).map((_, r) => {
          const uiRow = (color === 'black') ? (BOARD_SIZE - 1 - r) : r;
          return (
            <div className={cellSize === 1 ? styles.row : cellSize === 2 ? styles.smRow : styles.xsRow} key={uiRow}>
              {Array.from({ length: BOARD_SIZE }).map((_, c) => {
                const uiCol = (color === 'black') ? (BOARD_SIZE - 1 - c) : c;
                const pos = uiRow * BOARD_SIZE + (uiCol + 1);
                return (
                  <div
                    className={`${cellSize === 1 ? styles.cell : cellSize === 2 ? styles.smCell : styles.xsCell} ${(uiRow + uiCol + 2) % 2 === 0 ? styles.even : styles.odd}`}
                    key={String(pos) + 'a'}
                    id={String(pos)}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  );
}