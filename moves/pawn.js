export default function pawn(type, pos, positions, enPassantCtx = null) {
  const moves = [];
  const isWhite = type[0] === 'w';
  const dir = isWhite ? -8 : 8;
  const row = Math.floor((pos - 1) / 8);
  const one = pos + dir;
  if (!positions[one]) moves.push(one);

  const startRank = isWhite ? 6 : 1;
  const two = pos + 2 * dir;
  if (row === startRank && !positions[one] && !positions[two]) moves.push(two);

  const leftCap = isWhite ? (pos + dir - 1) : (pos + dir - 1);
  const rightCap = isWhite ? (pos + dir + 1) : (pos + dir + 1);

  const onLeftFile = (pos - 1) % 8 === 0;
  const onRightFile = pos % 8 === 0;

  if (!onLeftFile && positions[leftCap] && positions[leftCap][0] !== type[0]) moves.push(leftCap);
  if (!onRightFile && positions[rightCap] && positions[rightCap][0] !== type[0]) moves.push(rightCap);

  if (enPassantCtx && enPassantCtx.color !== type[0]) {
    const epTarget = enPassantCtx.targetPos;
    if (!onLeftFile && leftCap === epTarget) moves.push(epTarget);
    if (!onRightFile && rightCap === epTarget) moves.push(epTarget);
  }

  return moves.filter(m => m >= 1 && m <= 64);
}
