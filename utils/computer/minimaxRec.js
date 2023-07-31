import { castling, checkMate, getValidMoves, nextPositions, numOfColorPieces, piecePos } from "@/moves/helperFunctions";

/** Reverses an array. */
const reverseArray = (array) => {
  return array.reverse();
};

const pawn = [
  90, 90, 90, 90, 90, 90, 90, 90,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const pawnBlack = reverseArray(pawn);

const knight = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const knightBlack = reverseArray(knight);

const bishop = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const bishopBlack = reverseArray(bishop);

const rook = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const rookBlack = reverseArray(rook);

const queen = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const queenBlack = reverseArray(queen);

const king = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

const kingBlack = reverseArray(king);

const kingEndgame = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

const kingEndgameBlack = reverseArray(kingEndgame);

const pawnScore = 100;
const knightScore = 320;
const bishopScore = 330;
const rookScore = 500;
const queenScore = 900;

let already = {};

/** Returns a random value in an array. */
const random = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Copies the dictionary. */
const deepCopy = (position) => {
  let copy = JSON.stringify(position);
  copy = JSON.parse(copy);

  return copy;
}

/** Compares scores. */
const compare = (a, b) => {
  if ( a.amount < b.amount ){
    return -1;
  }
  else if ( a.amount > b.amount ){
    return 1;
  }
  return 0;
}

/** Getting the value of a piece. */
const getPieceValue = (piece) => {
  if (piece.includes("Pawn")) {
    return pawnScore;
  } else if (piece.includes("Bishop")) {
    return bishopScore;
  } else if (piece.includes("Knight")) {
    return knightScore;
  } else if (piece.includes("Rook")) {
    return rookScore;
  } else {
    return queenScore;
  }
}

/** Returns the positional value of certain pieces on the board. */
const getPosValue = (piece, pos, board) => {
  let color = piece[0];
  if (piece.includes("Pawn")) {
    return color === "w" ? pawn[pos - 1] : pawnBlack[pos - 1];
  } else if (piece.includes("Bishop")) {
    return color === "w" ? bishop[pos - 1] : bishopBlack[pos - 1];
  } else if (piece.includes("Knight")) {
    return color === "w" ? knight[pos - 1] : knightBlack[pos - 1];
  } else if (piece.includes("Rook")) {
    return color === "w" ? rook[pos - 1] : rookBlack[pos - 1];
  } else if (piece.includes("Queen")) {
    return color === "w" ? queen[pos - 1] : queenBlack[pos - 1];
  } else {
    if (numOfColorPieces(board, piece[0]) <= 4) {
      return color === "w" ? kingEndgame[pos - 1] : kingEndgameBlack[pos - 1];
    }
    return color === "w" ? king[pos - 1] : kingBlack[pos - 1];
  }
}

/** Counts and returns the values of pieces a team has left. */
const countMaterial = (position, color) => {
  let score = 0;

  for (let [pos, piece] of Object.entries(position)) {
    pos = parseInt(pos);
    if (!piece || piece.includes("King") || piece[0] !== color) continue;

    if (piece.includes("Pawn")) {
      score += color === "w" ? pawn[pos - 1] : pawnBlack[pos - 1];
      score += pawnScore;
    } else if (piece.includes("Bishop")) {
      score += color === "w" ? bishop[pos - 1] : bishopBlack[pos - 1];
      score += bishopScore;
    } else if (piece.includes("Knight")) {
      score += color === "w" ? knight[pos - 1] : knightBlack[pos - 1];
      score += knightScore;
    } else if (piece.includes("Rook")) {
      score += color === "w" ? rook[pos - 1] : rookBlack[pos - 1];
      score += rookScore;
    } else {
      score += queen[pos - 1];
      score += queenScore;
    }
  }

 if (color === "b" && numOfColorPieces(position, "w") <= 4) {
    score += forceKingEngame(position, "bKing", "wKing");
  }

  return score;
}

/** Evaluates the position by getting the difference of the values of white pieces against black pieces.  */
const evaluatePosition = (position) => {
  let whitePosition = countMaterial(position, "w");
  let blackPosition = countMaterial(position, "b");

  let evaluation = whitePosition - blackPosition;
  return evaluation;
}

/** Returns the best possible move. */
export const minimaxRoot = (depth, position, turn, castle, lCastle, rCastle, passedMoves) => {
  let children = getChildren(position, turn, castle, lCastle, rCastle);
  let best = -Infinity;
  let bestMoveFound = [];
  already = passedMoves;

  for (let i = 0; i < children.length; i++) {
    let move = children[i];
    let copyBoard = deepCopy(position);
    copyBoard = moveBoard(copyBoard, move);

    let value = minimaxRecursion(copyBoard, depth, -Infinity, Infinity, !turn, castle, lCastle, rCastle);

    if (value > best) {
      best = value;
      bestMoveFound = [move];
    } else if (value === best) {
      bestMoveFound.push(move);
    }
  }

  return bestMoveFound.length > 1 ? [random(bestMoveFound), already] : [bestMoveFound[0], already];
}

/** Recursively goes through all the moves and the next ones to a certain depth, returning the values. */
const minimaxRecursion = (position, depth, alpha, beta, turn, castle, lCastle, rCastle) => {
  if (depth === 0) {
    return -evaluatePosition(position);
  }

  let moves;
  let fen = posToFen(position, turn);
  let created = fen in already;

  if (created) {
    // console.log(fen);
    moves = already[fen]
  } else {
    moves = getChildren(position, turn, castle, lCastle, rCastle);
  }
  
  if (moves.length === 0) {
    if (checkMate(turn ? "black" : "white", position)) {
      return turn ? -Infinity : Infinity;
    }
    return 0;
  } 
  
  if (!created) {
    moves = orderMoves(moves, position, turn);
    already[fen] = moves;
  }

  if (turn) {
    let maxEval = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      let move = moves[i];
      let copyBoard = deepCopy(position);
      copyBoard = moveBoard(copyBoard, move);
      let evaluation = minimaxRecursion(copyBoard, depth - 1, alpha, beta, !turn);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        return maxEval;
      }
    }
  
    return maxEval;
  }
  
  else {
    let minEval = Infinity;
    for (let i = 0; i < moves.length; i++) {
      let move = moves[i];
      let copyBoard = deepCopy(position);
      copyBoard = moveBoard(copyBoard, move);
      let evaluation = minimaxRecursion(copyBoard, depth - 1, alpha, beta, !turn);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        return minEval;
      }
    }
    
    return minEval;
  }
}

/** Moves the piece from one pos to another. */
const moveBoard = (board, move) => {
  let piece = move[0];
  board[move[3]] = piece;
  board[move[2]] = null;

  return board;
}

/** Getting all the possible moves.  */
const getChildren = (position, turn, castle, lCastle, rCastle) => {
  let children = [];
  let color = "";

  if (turn) {
    color = "b";
  } else {
    color = "w";
  }

  for (let [pos, piece] of Object.entries(position)) {
    if (!piece || piece[0] !== color) continue;
    pos = parseInt(pos);
    let valid = getValidMoves(piece, pos, position);
    valid = nextPositions(position, valid, color === "w" ? "white" : "black", pos, piece);

    if (piece === "bKing") {
      let moreVals = castling(castle, piece, position, "black", lCastle, rCastle);
      valid = valid.concat(moreVals);
    }

    for (let i = 0; i < valid.length; i++) {
      let moves = [];
      moves.push(piece);
      moves.push(position[valid[i]]);
      moves.push(pos);
      moves.push(valid[i]);

      children.push(moves);
    }
  }

  return children;
}

/** Orders all the moves from best to worst based on pieces won/lost. */
const orderMoves = (moves, position, turn) => {
  let ordered = [];
  let movesOrdered = [];

  for (let i = 0; i < moves.length; i++) {
    let move = moves[i];
    let moveScore = 0;
    let movePiece = move[0];
    let capPiece = move[1];
    let prevPos = move[2];
    let nextPos = move[3];

    moveScore += getPosValue(movePiece, nextPos, position) - getPosValue(movePiece, prevPos, position);

    if (capPiece !== null) {
      moveScore += 10 * getPieceValue(capPiece) - getPieceValue(movePiece);
    }

    if (movePiece.includes("wPawn")) {
      if (64 >= nextPos >= 56) {
        moveScore += getPieceValue("wQueen");
      }
    } else if (movePiece.includes("bPawn")) {
      if (8 >= nextPos >= 1) {
        moveScore += getPieceValue("bQueen");
      }
    }

    if (nextMoves(position, turn ? "w" : "b", movePiece)) {
      moveScore -= getPieceValue(movePiece);
    }

    ordered.push({
      move: move,
      amount: moveScore
    });
  }

  ordered.sort(compare);
  
  for (let i = ordered.length - 1; i > -1; i--) {
    let current = ordered[i];
    movesOrdered.push(current.move);
  }

  return movesOrdered;
}

/** Gets the next moves after a piece was played. */
const nextMoves = (position, color, movePiece) => {
  for (let [pos, piece] of Object.entries(position)) {
    if (!piece || piece[0] !== color) continue;
    pos = parseInt(pos);

    let valid = getValidMoves(piece, pos, position);
    valid = nextPositions(position, valid, color === "w" ? "white" : "black", pos, piece);

    if (valid.indexOf(piecePos(position, movePiece)) !== -1) {
      return true;
    }
  }

  return false;
}

/** Gets the rank of the piece. */
const PieceRank = (pos) => {
  let rank = 9 - Math.ceil(pos / 8);
  return rank;
}

/** Gets the file of the piece. */
const PieceFile = (pos) => {
  let file = pos % 8;
  if (file === 0) {
    file = 8;
  }

  return file;
}

/** Forces the king to the corners in engame scenarios. */
const forceKingEngame = (position, friendly, opponent) => {
  let evaluation = 0;
  let oppKing = piecePos(position, opponent);

  let oppRank = PieceRank(oppKing);
  let oppFile = PieceFile(oppKing);

  let oppDstFile = Math.max(3 - oppFile, oppFile - 4);
  let oppDstRank = Math.max(3 - oppRank, oppRank - 4);
  let oppDst = oppDstFile + oppDstRank;

  evaluation += oppDst;

  let frKing = piecePos(position, friendly);
  let frRank = PieceRank(frKing);
  let frFile = PieceFile(frKing);

  let dstBtKingsFile = Math.abs(frFile - oppFile);
  let dstBtKingsRank = Math.abs(frRank - oppRank);
  let dstBtKings = dstBtKingsFile + dstBtKingsRank;

  evaluation += 14 - dstBtKings;

  return evaluation * 10;
}

/** Takes the positions dictionary and turns it into a fen string. */
export const posToFen = (position, turn) => {
  let fen = "";
  let count = 0;

  let dictionary = {
    "King": "k",
    "Pawn": "p",
    "Rook": "r",
    "Knight": "n",
    "Bishop": "b",
    "Queen": "q"
  };

  for (let [pos, piece] of Object.entries(position)) {
    pos = parseInt(pos);
    if (!piece) {
      count += 1;
    }
    else {
      if (piece.includes("King") || piece.includes("Queen")) {
        if (count !== 0) {
          fen += count.toString();
          count = 0;
        }
        let fenPiece = dictionary[piece.substr(1)];
        fenPiece = piece[0] === "b" ? fenPiece : fenPiece.toUpperCase();
        fen += fenPiece;
      }
      else {
        if (count !== 0) {
          fen += count.toString();
          count = 0;
        }
        let fenPiece = dictionary[piece.substr(1, piece.length - 3)];
        fenPiece = piece[0] === "b" ? fenPiece : fenPiece.toUpperCase();
        fen += fenPiece;
      }
    }

    if (pos % 8 === 0) {
      
      if (count !== 0) {
        fen += count.toString();
        count = 0;
      }

      fen += "/";
    }
  }

  fen = fen.substring(0, fen.length - 1);

  if (turn) fen += " w ";
  else fen += " b ";

  return fen;
}