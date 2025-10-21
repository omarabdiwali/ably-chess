**AblyChess: A Real-Time Online Chess Experience**
=====================================================

AblyChess is a fully functional online chess game built with React, Next.js, TailwindCSS, and Ably, utilizing a MongoDB Cluster as a database. This project showcases a seamless integration of real-time multiplayer capabilities, robust game logic, and a user-friendly interface.

![Home Page](https://i.imgur.com/EvEGsOA.png)

**Gameplay Features**
--------------------

*   **Multiplayer Support**: Join a room with a code or create a new one automatically. Ably channels ensure a smooth experience for up to 2 players, with reconnection capabilities.
*   **Public Games**: Opt for a public game and get matched with another player who has chosen the same option.
*   **Real-Time Updates**: The game board updates in real-time, reflecting the current state of the game.

**Technical Highlights**
------------------------

*   **MongoDB Integration**: The MongoDB Cluster stores room information, including users, current positions, turn status, public status, and room code. Documents are automatically deleted when the user count reaches 0, allowing for code reuse, and when it hasn't been updated in 30 minutes.
*   **Custom Game Logic**: All game logic, including piece movement, checkmate detection, and special moves like castling and promotion, was implemented from scratch.
*   **Sound Effects**: The game features sound effects for various events, such as piece movement, capture, check, and game end, enhancing the overall gaming experience.

**User Experience**
-------------------

*   **Intuitive Interface**: The game board is easy to navigate, with clear indications of valid moves and the previous opponent's move.
*   **Visual Feedback**: Valid piece movements are highlighted in red, and the previous move is also highlighted for clarity.
*   **Board Orientation**: The chessboard is oriented towards the player, meaning it is flipped when playing as Black to provide a more natural and immersive experience.

**Live Demo and Screenshots**
-----------------------------

Try out the live website: https://ably-chess.vercel.app

### Valid Movements

![Valid movements](https://i.imgur.com/ACFyeJL.png)

### Pawn Promotion 

![Pawn Promotion ](https://i.imgur.com/SrnSa9f.png)

**Technical Details**
---------------------

For those interested in the technical aspects, the project is built using:

*   React and Next.js for the frontend
*   Ably for real-time multiplayer capabilities
*   MongoDB Cluster as the database
