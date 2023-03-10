export default function pawn(type, pos, currPositions) {
  if (type.includes("wPawn")) {
    let validd = []
    let cap9 = pos - 9, cap7 = pos - 7;
    let capPiece = currPositions[cap9], capPiece1 = currPositions[cap7];

    if (capPiece && capPiece[0] === "b" && pos % 8 !== 1 && cap9 <= 64 && cap9 >= 1) {
      validd.push(cap9);
    }

    if (capPiece1 && capPiece1[0] === "b" && pos % 8 !== 0 && cap7 <= 64 && cap7 >= 1) {
      validd.push(cap7);
    }

    if (49 <= pos && pos <= 56) {
      let piece = currPositions[pos - 8];
      let piece1 = currPositions[pos - 16];

      if (!piece && !piece1) {
        validd.push(pos - 8);
        validd.push(pos - 16);
      }
      else if (!piece) {
        validd.push(pos - 8);
      }

    }
    else {
      if (pos >= 9) {
        let piece = currPositions[pos - 8];
        if (!piece) {
          validd.push(pos - 8);
        }
      }
    }
    return validd;
  }

  else if (type.includes("bPawn")) {
    let validd = [];
    let cap9 = pos + 9, cap7 = pos + 7;
    let capPiece = currPositions[cap9], capPiece1 = currPositions[cap7];

    if (capPiece && capPiece[0] === "w" && pos % 8 !== 0 && cap9 <= 64 && cap9 >= 1) {
      validd.push(cap9);
    }

    if (capPiece1 && capPiece1[0] === "w" && pos % 8 !== 1 && cap7 <= 64 && cap7 >= 1) {
      validd.push(cap7);
    }

    if (9 <= pos && pos <= 16) {
      let piece = currPositions[pos + 8];
      let piece1 = currPositions[pos + 16];

      if (!piece && !piece1) {
        validd.push(pos + 8);
        validd.push(pos + 16);
      }
      else if (!piece) {
        validd.push(pos + 8);
      }

    }
    else {
      if (pos <= 56) {
        let piece = currPositions[pos + 8];
        if (!piece) {
          validd.push(pos + 8);
        }
      }
    }
    return validd;
  }
}