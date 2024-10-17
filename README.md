# chess
A online chess game created with React, Next.js, and Socket.io, with a MongoDB Cluster as a database.
It is a chess board, available with all moves and rules, excluding en passant.

A text input is given at the home page, where users can join a room with a code, or automatically create a room.
These socket rooms only allow 2 people, and reconnection is available. Players are also able to join public games, where they are matched up to someone else who also chose the same option.

The MongoDB Cluster stores information about the rooms, which include the users, the current positions, who's turn it is, if it is public, and the code. To be able to reuse codes, the document in the collection is automatically deleted once the users are equal to 0.

Valid positions for the piece are shown on your screen in red, and the previous position played by the opposition is also highlighted.
Sounds are also played during the game, with movement, castling, promotion, check, capture, and game-end having their own sounds.
All of the functions were written by me, including the logic for the pieces, when checkmate happens, and handling sockets and API calls.

![Home Page](https://i.imgur.com/5Rt2CNJ.png)


![Vaild movements](https://i.imgur.com/vEN0Ubp.png)


![Checkmate](https://i.imgur.com/EtfZaua.png)