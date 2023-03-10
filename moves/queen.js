import bishop from './bishop.js';
import rook from './rook.js';

export default function queen(col, pos, currPositions) {
  let a = rook(col, pos, currPositions);
  let b = col === "w" ? bishop("b", pos, currPositions) : bishop("w", pos, currPositions);
  let valid = a.concat(b.filter((item) => a.indexOf(item) < 0));
  return valid;
}