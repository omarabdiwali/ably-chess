# chess
A online chess game created with ReactJS and Socket.io, with a MongoDB Cluster as a database.
It is a chess board, available with all kinds of rules, excluding en passant.

A text input is given at the home page, where users can join a room with a code, or automatically create a room.
These socket rooms only allow 2 people, and reconnection is available.

The MongoDB Cluster stores information about the rooms, which include the users, the current positions, who's turn it is, and the code.
To be able to reuse codes, the document in the collection is automatically deleted once the users are equal to 0.

Valid positions for the piece are shown on your screen in red, and the previous position played by the opposition is also highlighted.
All of the functions were written by me, including the logic for the pieces, when checkmate happens, and handling sockets and API calls

![Chess board](https://i.imgur.com/Rx1WSwtl.png)


![Opponent disconnection](https://i.imgur.com/sdgwOT3l.png)


![Vaild movements](https://i.imgur.com/p53gIAql.png)


![Checkmate](https://i.imgur.com/go0LTNUl.png)