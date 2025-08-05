import bishop from "./bishop";
import knight from "./knight";
import pawn from "./pawn";
import queen from "./queen";
import rook from "./rook";
import king from "./king";

/** En passant context (target square and captured pawn square). */
let __enPassant = null; // { targetPos: number, capturedPos: number, color: 'w'|'b' }

export function setEnPassant(ctx) { __enPassant = ctx; }
export function clearEnPassant() { __enPassant = null; }

/** Checks if the pieces are on the same team. */
export function checkSamePiece(currPositions, pos, type) {
  let piece = currPositions[pos];
  if (piece && piece[0] === type) {
    return false;
  }
  else {
    return true;
  }
};

/** Getting the valid moves from the piece. */
export function getValidMoves(type, pos, currPositions) {
  if (type.includes('Pawn')) {
    return pawn(type, pos, currPositions, __enPassant);
  } else if (type.includes('Rook')) {
    return type[0] === "w" ? rook("w", pos, currPositions) : rook("b", pos, currPositions);
  } else if (type.includes("Knight")) {
    return type[0] === "w" ? knight("w", pos, currPositions) : knight("b", pos, currPositions);
  } else if (type.includes("Bishop")) {
    return type[0] === "w" ? bishop("b", pos, currPositions) : bishop("w", pos, currPositions);
  } else if (type.includes("Queen")) {
    return type[0] === "w" ? queen("w", pos, currPositions) : queen("b", pos, currPositions);
  } else if (type.includes("King")) {
    return type[0] === "w" ? king("w", pos, currPositions) : king("b", pos, currPositions);
  }
}

/** Takes a fen string and returns its dictionary equivalent. */
export function fenString(startString) {
  let currPositions = {}
  let drawPos = 1;
  let bPawn = 1;
  let wPawn = 1;
  let bRook = 1;
  let wRook = 1;
  let bKnight = 1;
  let wKnight = 1;
  let bBishop = 1;
  let wBishop = 1;

  for (let i = 0; i < startString.length; i++) {
    let letter = startString[i];

    if (!isNaN(letter)) {
      letter = parseInt(letter);
      for (let i = drawPos; i <= drawPos + letter; i++) {
        currPositions[i] = null;
      }
      drawPos += letter;
    }
    
    else if (letter === letter.toLowerCase() && letter !== '/') {
      let type;
      if (letter === 'p') {
        type = 'bPawn ' + String(bPawn);
        bPawn += 1;
      } else if (letter === 'r') {
        type = 'bRook ' + String(bRook);
        bRook += 1;
      } else if (letter === 'n') {
        type = 'bKnight ' + String(bKnight);
        bKnight += 1;
      } else if (letter === 'b') {
        type = "bBishop " + String(bBishop);
        bBishop += 1;
      } else if (letter === 'k') {
        type = "bKing";
      } else if (letter === 'q') {
        type = "bQueen";
      }
      
      currPositions[drawPos] = type;
      drawPos += 1;
    }

    else if (letter === letter.toUpperCase() && letter !== '/') {
      let type;
      if (letter === 'P') {
        type = 'wPawn ' + String(wPawn);
        wPawn += 1;
      } else if (letter === 'R') {
        type = 'wRook ' + String(wRook);
        wRook += 1;
      } else if (letter === 'N') {
        type = 'wKnight ' + String(wKnight);
        wKnight += 1;
      } else if (letter === 'B') {
        type = 'wBishop ' + String(wBishop);
        wBishop += 1;
      } else if (letter === 'K') {
        type = "wKing";
      } else if (letter === 'Q') {
        type = "wQueen";
      }

      currPositions[drawPos] = type;
      drawPos += 1;
    }
  }

  return currPositions;
}

/** Colors the square where a move is valid. */
export function colorValid(valid) {
  for (let i = 0; i < valid.length; i++) {
    const cur = valid[i];
    const { row, col } = posToRC(cur, window.__isBlackView);
    const el = document.getElementById("board").childNodes.item(`${row}`).children[col];
    if (el.className.includes("even")) {
      el.style.backgroundColor = "rgb(221, 89, 89)";
    } else {
      el.style.backgroundColor = "rgb(197, 68, 79)";
    }
  }
}

/** Putting the color of the square back to its original. */
export function clearColors(pos) {
  if (pos.length > 0 && pos[0] !== undefined) {
    for (let i = 0; i < pos.length; i++) {
      const cur = pos[i];
      const { row, col } = posToRC(cur, window.__isBlackView);
      const el = document.getElementById("board").childNodes.item(`${row}`).children[col];
      if (el.className.includes("odd")) {
        el.style.backgroundColor = "rgba(138, 87, 66, 1)";
      } else {
        el.style.backgroundColor = "rgba(238, 216, 192, 1)";
      }
    }
  }
}

function normalizePromotion(type, choice) {
  if (!choice) return null;
  const color = type[0] === 'w' ? 'w' : 'b';
  const allowed = ['Queen','Rook','Bishop','Knight'];
  if (!allowed.includes(choice)) return null;
  return `${color}${choice}`;
}

/** Takes your move and updates the position. */
export function updateCurPositions(
  type,
  pos,
  curPos,
  prevPos,
  castle = false,
  lCastle = false,
  rCastle = false,
  enPassantCtx = null,
  promotionChoice = null
) {
  let positions = curPos;

  clearSquare(prevPos);
  clearSquare(pos);

  if (enPassantCtx && type.includes('Pawn') && pos === enPassantCtx.targetPos) {
    const capturedSquare = enPassantCtx.capturedPos;
    clearSquare(capturedSquare);
    positions[capturedSquare] = null;
  }

  // Handle promotion using chosen piece if any
  if (type.includes("wPawn") && (pos >= 1 && pos <= 8)) {
    const newType = normalizePromotion(type, promotionChoice) || "wQueen";
    type = newType;
  } else if (type.includes("bPawn") && (pos >= 57 && pos <= 64)) {
    const newType = normalizePromotion(type, promotionChoice) || "bQueen";
    type = newType;
  }

  if (castle) {
    if (type === "wKing" && prevPos === 61 && pos === 63 && rCastle) {
      clearSquare(62);
      clearSquare(64);
      const { row: rRow, col: rCol } = posToRC(62, window.__isBlackView);
      const square = document.getElementById("board").childNodes.item(`${rRow}`).children[rCol];
      const piece = drawImage("wRook 2", 62);
      square.appendChild(piece);
      positions[64] = null;
      positions[62] = "wRook 2";
    } 
    else if (type === "wKing" && prevPos === 61 && pos === 59 && lCastle) {
      clearSquare(57);
      clearSquare(60);
      const { row: rRow, col: rCol } = posToRC(60, window.__isBlackView);
      const square = document.getElementById("board").childNodes.item(`${rRow}`).children[rCol];
      const piece = drawImage("wRook 1", 60);
      square.appendChild(piece);
      positions[57] = null;
      positions[60] = "wRook 1";
    } 
    else if (type === "bKing" && prevPos === 5 && pos === 7 && rCastle) {
      clearSquare(6);
      clearSquare(8);
      const { row: rRow, col: rCol } = posToRC(6, window.__isBlackView);
      const square = document.getElementById("board").childNodes.item(`${rRow}`).children[rCol];
      const piece = drawImage("bRook 2", 6);
      square.appendChild(piece);
      positions[8] = null;
      positions[6] = "bRook 2";
    } 
    else if (type === "bKing" && prevPos === 5 && pos === 3 && lCastle) {
      clearSquare(1);
      clearSquare(4);
      const { row: rRow, col: rCol } = posToRC(4, window.__isBlackView);
      const square = document.getElementById("board").childNodes.item(`${rRow}`).children[rCol];
      const piece = drawImage("bRook 1", 4);
      square.appendChild(piece);
      positions[1] = null;
      positions[4] = "bRook 1";
    }
  }

  const { row, col } = posToRC(pos, window.__isBlackView);
  const sq = document.getElementById("board").childNodes.item(`${row}`).children[col];
  const piece = drawImage(type, pos);
  sq.appendChild(piece);

  positions[prevPos] = null;
  positions[pos] = type;

  return positions;
}

/** Starts the game by putting the pieces in its places. */
export function startGame(positions) {
  for (let [pos, val] of Object.entries(positions)) {
    if (val) {
      const p = parseInt(pos);
      const { row, col } = posToRC(p, window.__isBlackView);
      const sq = document.getElementById("board").childNodes.item(`${row}`).children[col];
      const piece = drawImage(val, p);
      sq.appendChild(piece);
    }
  }
}


/** Colors the square that you are currently playing with. */
export function colorSquare(pos) {
  const { row, col } = posToRC(pos, window.__isBlackView);
  const sq = document.getElementById("board").childNodes.item(`${row}`).children[col];
  if (sq.className.includes("even")) {
    sq.style.backgroundColor = "rgb(235, 197, 123)";
  } else {
    sq.style.backgroundColor = "rgb(200, 158, 80)";
  }
}


/** Checks if the game is at a checkmate. */
export function checkMate(next, positions) {
  let piecesOfColor = numOfColorPieces(positions, next[0]);
  let count = 0;
  if (piecesOfColor === 1 && numOfColorPieces(positions, next[0] === "w" ? "b" : "w") === 1) {
    return [true, "Tie Game!"];
  }
  for (let [pos, piece] of Object.entries(positions)) {
    if (count < piecesOfColor) {
      if (piece && piece[0] === next[0]) {
        count += 1;
        let moves = getValidMoves(piece, parseInt(pos), positions);
        let acValid = nextPositions(positions, moves, next, parseInt(pos), piece);
        if (acValid.length > 0) {
          return [false, ""];
        }
      }
    }
    else {
      if (next === "white") return [true, "Black Wins"];
      else return [true, "White Wins"];
    }
  }
}

/** Gets the position after a move is made. */
export function nextPositions(position, valid, next, pos, piece, enPassantCtx = null) {
  let acValid = [];
  let nahPos = position;
  for (let i = 0; i < valid.length; i++) {
    const nxtPos = valid[i];
    let ogPiece = position[nxtPos];
    const epTarget = enPassantCtx && piece.includes('Pawn') ? enPassantCtx.targetPos : null;
    const epCaptured = enPassantCtx && piece.includes('Pawn') ? enPassantCtx.capturedPos : null;

    let removedEpPiece = null;
    nahPos[pos] = null;

    if (epTarget && nxtPos === epTarget) {
      removedEpPiece = nahPos[epCaptured];
      nahPos[epCaptured] = null;
      nahPos[nxtPos] = piece;
    } else {
      nahPos[nxtPos] = piece;
    }

    if (!checked(next, nahPos)) {
      acValid.push(nxtPos);
    }

    if (epTarget && nxtPos === epTarget) {
      nahPos[nxtPos] = ogPiece;
      nahPos[epCaptured] = removedEpPiece;
    } else {
      nahPos[nxtPos] = ogPiece;
    }
    nahPos[pos] = piece;
  }

  return acValid;
}


/** Moves the pieces of the other player. */
export function otherPlayerMoves(newPosition, prev, current) {
  const piece = newPosition[current];
  let positions = {};

  clearSquare(prev);

  if (piece === "wKing" && prev === 61 && (current === 63 || current === 59)) {
    positions = updateCurPositions(piece, current, newPosition, prev, true, true, true);
  } else if (piece === "bKing" && prev === 5 && (current === 7 || current === 3)) {
    positions = updateCurPositions(piece, current, newPosition, prev, true, true, true);
  } else {
    positions = updateCurPositions(piece, current, newPosition, prev);
  }

  movedSquaresPos(prev);
  movedSquaresPos(current);

  return positions;
}


/** Checks if castle is available. */
export function checkCastle(piece, lCastle, rCastle) {
  if (piece.includes("King")) {
    return [false, false, false];
  }
  else {
    if (piece === "wRook 1" && lCastle) {
      return [true, false, true];
    }
    else if (piece === "wRook 2" && rCastle) {
      return [true, true, false];
    }
    else if (piece === "bRook 1" && lCastle) {
      return [true, false, true];
    }
    else if (piece === "bRook 2" && rCastle) {
      return [true, true, false];
    }
    else {
      return [true, true, true];
    }
  }
}

/** Take scare of castling. */
export function castling(avail, piece, position, color, lCastle, rCastle) {
  let good = [];
  let tempPosition = JSON.stringify(position);
  tempPosition = JSON.parse(tempPosition);
  if (avail) {
    if (piece[0] === "w") {
      if (!tempPosition[63] && !tempPosition[62] && rCastle) {
        if (piecePos(position, "wRook 2") !== 64) {
          return [];
        }
        let list = [62, 63];
        let valid = nextPositions(tempPosition, list, color, 61, piece);
        if (list.length === valid.length) {
          good.push(63);
        }
      }
      if (!tempPosition[60] && !tempPosition[59] && !tempPosition[58] && lCastle) {
        if (piecePos(position, "wRook 1") !== 57) {
          return [];
        }
        let list = [60, 59, 58];
        let valid = nextPositions(tempPosition, list, color, 61, piece);
        if (list.length === valid.length) {
          good.push(59)
        }
      }
    }
    else {
      if (!tempPosition[2] && !tempPosition[3] && !tempPosition[4] && lCastle) {
        if (piecePos(tempPosition, "bRook 1") !== 1) {
          return [];
        }
        let list = [2, 3, 4];
        let valid = nextPositions(tempPosition, list, color, 5, piece);
        if (list.length === valid.length) {
          good.push(3);
        }
      }
      if (!tempPosition[6] && !tempPosition[7] && rCastle) {
        if (piecePos(position, "bRook 2") !== 8) {
          return [];
        }
        let list = [6, 7];
        let valid = nextPositions(tempPosition, list, color, 5, piece);
        if (list.length === valid.length) {
          good.push(7);
        }
      }
    }
  }
  return good;
}

/** Gets the position of the pieces on the board. */
export function piecePos(object, value) {
  let ind = Object.keys(object).find(key => object[key] && object[key].includes(value) === true);
  return ind ? parseInt(ind) : ind;
}

/** Counts the number of pieces for a side left. */
export function numOfColorPieces(object, color) {
  return Object.values(object).filter(val => val && val[0] === color).length;
}

export function translateMove(move) {
  const row = 8 - move[1];
  const col = move[0] - 1;
  return rcToPos(row, col, window.__isBlackView);
}


/** Colors the square where the last move was from. */
function movedSquaresPos(pos) {
  const { row, col } = posToRC(pos, window.__isBlackView);
  const el = document.getElementById("board").childNodes.item(`${row}`).children[col];
  if (el.className.includes("odd")) {
    el.style.backgroundColor = "rgb(197, 158, 94)";
  } else {
    el.style.backgroundColor = "rgb(221, 207, 124)";
  }
}


/** Checks if the move puts you in check. */
export function checked(next, positions) {
  let turn = next === "white" ? "b" : "w";
  let valid = [];
  let king = next[0] + "King";
  let kingPos = piecePos(positions, king);
  for (let [pos, piece] of Object.entries(positions)) {
    if (piece && piece[0] === turn) {
      let moves = getValidMoves(piece, parseInt(pos), positions);
      valid = valid.concat(moves)
    }
  }

  return valid.includes(parseInt(kingPos));
}

/** Draws the piece on the board. */
function drawImage(type, pos) {
  let img = document.createElement("img");
  let imgSrc = imageType(type);
  img.src = `${window.location.origin}/images/${imgSrc}.png`
  img.alt = `${type}`
  img.id = `${pos}`;
  
  img.style.display = "block";
  img.style.margin = "0 auto";

  img.style.maxWidth = "100%";
  img.style.height = "auto";
  
  img.style.position = "relative";
  img.style.top = "45%";
  img.style.transform = "translateY(-50%)";

  return img;
}

/** Clears the piece from the square. */
export function clearSquare(pos) {
  const { row, col } = posToRC(pos, window.__isBlackView);
  const sq = document.getElementById("board").childNodes.item(`${row}`).children[col];
  if (sq.firstChild) {
    const img = sq.children[0];
    sq.removeChild(img);
  }
}

/** Returns the image source. */
export function imageType(type) {
  if (type.includes("Pawn")) {
    return type[0] === "b" ? "P" : "pL";
  }
  else if (type.includes("Knight")) {
    return type[0] === "b" ? "N" : "nL";
  }
  else if (type.includes("Rook")) {
    return type[0] === "b" ? "R" : "rL";
  }
  else if (type.includes("Bishop")) {
    return type[0] === "b" ? "B" : "bL";
  }
  else if (type.includes("King")) {
    return type[0] === "b" ? "K" : "kL";
  }
  else if (type.includes("Queen")) {
    return type[0] === "b" ? "Q" : "qL";
  }
}

export function rcToPos(row, col, isBlackView) {
  if (isBlackView) {
    const r = 7 - row;
    const c = 7 - col;
    return r * 8 + (c + 1);
  } else {
    return row * 8 + (col + 1);
  }
}

export function posToRC(pos, isBlackView) {
  let row = Math.floor(pos / 8);
  let col = (pos - (row * 8) - 1);

  if (pos % 8 === 0) {
    col = 7;
    row -= 1;
  }

  if (isBlackView) {
    return { row: 7 - row, col: 7 - col };
  } else {
    return { row, col };
  }
}