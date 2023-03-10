import { checkSamePiece } from './helperFunctions.js';

export default function king(col, pos, currPositions) {
  let tR = pos - 7, tL = pos - 9, t = pos - 8, r = pos + 1,
    l = pos - 1, bR = pos + 9, bL = pos + 7, b = pos + 8;
  
  let valid = [];
  
  if (pos % 8 === 1) {
    let curValid = [tR, t, r, bR, b];
    for (let i = 0; i < curValid.length; i++) {
      const curPos = curValid[i];
      if (curPos <= 64 && curPos >= 1 && checkSamePiece(currPositions, curPos, col)) {
        valid.push(curPos);
      }
    }
  }

  else if (pos % 8 === 0) {
    let curValid = [tL, t, l, bL, b];
    for (let i = 0; i < curValid.length; i++) {
      const curPos = curValid[i];
      if (curPos <= 64 && curPos >= 1 && checkSamePiece(currPositions, curPos, col)) {
        valid.push(curPos);
      }
    }
  }

  else {
    let curValid = [tR, t, tL, r, l, bR, b, bL];
    for (let i = 0; i < curValid.length; i++) {
      const curPos = curValid[i];
      if (curPos <= 64 && curPos >= 1 && checkSamePiece(currPositions, curPos, col)) {
        valid.push(curPos);
      }
    }
  }

  return valid;
  
}