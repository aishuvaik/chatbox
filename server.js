const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser,userLeave, getRoomUsers } = require('./utils/users')


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder to access the HTML
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatBox';

//Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {

        const user = userJoin(socket.id, username, room)
        socket.join(user.room);
        //emits just to the single client that is connecting
        socket.emit('message', formatMessage(botName, 'Welcome to ChatBox!!!'));

        //Broadcast when a user connects -->boradcast emits everybody except the user
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    
    });

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            //emit to everyone
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        
            //Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        
    });
    
});

// const PORT = 3000 || process.env.PORT;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//var port_number = server.listen(process.env.PORT || 3000);
//app.listen(port_number);

var port_number = process.env.PORT || 3000;
server.listen(port_number);

// // app.listen(process.env.PORT || 3000, function(){
// //     console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
// // });

// var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
// var server_host = process.env.YOUR_HOST || '0.0.0.0';
// server.listen(server_port, server_host, function() {
//     console.log('Listening on port %d', server_port);
// });
