import { Server } from "socket.io";

const SocketHandler = (_, res) => {
  let io;
  let numClients = {};

  if (res.socket.server.io) {
    io = res.socket.server.io;
  }
  
  else {  
    io = new Server(res.socket.server);
   
    res.socket.server.io = io;

    io.on('connection', (socket) => {

      socket.on('joinRoom', (info) => {
        let data = JSON.parse(info);
        socket.join(data.room);
        socket.room = data.room;
        socket.color = data.color;

        if (numClients[data.room] === undefined) {
          numClients[data.room] = 1;
        } else {
          numClients[data.room] = 2;
        }

      });
    
      socket.on('pieces', (pieces) => {
        let temp = JSON.parse(pieces);
        fetch(`/api/move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: socket.room, position: temp.pieces, turn: temp.turn })
        }).catch(err => console.error(err))
        
        socket.to(socket.room).emit('pieces', (pieces));
      })
    
      socket.on('start', () => {
        socket.to(socket.room).emit('start');
      })
    
      socket.on('game', (winner) => {
        socket.to(socket.room).emit('game', (winner));
      })
    
      socket.on('disconnect', async () => {        
        if (socket.room) {
          let users = numClients[socket.room];

          if (users === 1) {
            socket.to(socket.room).emit('delete');
            delete numClients[socket.room];
            users = 0;
          } else {
            numClients[socket.room]--;
            users -= 1;
          }
                
          fetch(`/api/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ code: socket.room, users: users, color: socket.color })
          }).catch(err => console.error(err))
    
          socket.leave(socket.room);
          socket.room = null;
          socket.color = null;
        }
      })
    })
  }
  
  res.end()
}

export default SocketHandler