function imageType(type) {
  let index = type.indexOf(" ");
  let piece = "";
  if (index != -1) {
    type = type.substring(0, index);
  }
  
  switch (type) {
    case 'wPawn' || 'bPawn':
      piece = type == 'wPawn' ? "pL" : "P"
      break
    case 'wRook' || 'bRook':
      piece = type == "wRook" ? 'rL' : "R";
      break
    case 'wBishop' || 'bBishop':
      piece = type == 'wBishop' ? 'bL' : 'B';
      break
    case 'wKnight' || 'bKnight':
      piece = type == 'wKnight' ? 'nL' : 'N';
      break
    case 'wQueen' || 'bQueen':
      piece = type == 'wQueen' ? 'qL' : 'Q';
      break
    default:
      piece = type == 'wKing' ? 'kL' : "K";
  }

  return piece;
}