const http = require('http');
const server = http.createServer();
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {
    socket.on('create_class', class_code => {
        socket.join(class_code)
    })

    socket.on('join_class', data => {
        socket.current_class = data.class_id
        socket.name = data.name
        socket.join(data.class_id)
        io.to(data.class_id).emit('student_joined', { id: socket.id, name: data.name, emotion: data.emotion })
    })

    socket.on('update_emotion', new_emotion => {
        io.to(socket.current_class).emit('emotion_updated', { id: socket.id, emotion: new_emotion })
    })

    socket.on('disconnect', () => {
        if (socket.current_class) io.to(socket.current_class).emit('student_left', socket.id)
    })

    socket.on('kick_student', student_id => {
        io.to(student_id).emit('kicked')
    })
});

server.listen(8000, () => {
    console.log('listening on *:8000');
});