const path = require('path');
const http = require('http')
const express = require('express');
const socketIo = require('socket.io');
const Filter = require('bad-words') // is it contain bad words?
const {generateMessage, generateUrl} = require('./utils/message')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/user')

const app = express();
const server = http.createServer(app);
const io = socketIo(server)

const PORT = process.env.PORT || 3000;

app.set("view engine", "html");
app.use(express.static(path.join(__dirname, '../public')))

io.on('connection',(socket)=>{

    // After joining the room sending a welcom message
    // options = {username, room} 
    socket.on('join', (options, callback)=>{

        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome', `Admin`));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`,`Admin`))

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const filter = new Filter();
        const user = getUser(socket.id)

        if(user){
            if(filter.isProfane(message)){
                return callback('Profanity is not allowed!')
            }

            io.to(user.room).emit('message', generateMessage(message, `${user.username}`));

            // acknowlegement
            callback()
        }
    })

    socket.on('sendLocation', (locationObj, callback)=>{
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateUrl(`https://google.com/maps?q=${locationObj.longitude}.${locationObj.latitude}`, `${user.username}`))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`, `Admin`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen( PORT, ()=>{
    console.log(`Server ${PORT} is connected!`)
})
