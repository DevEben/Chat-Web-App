require('./dbconfig/dbConfig');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const messageRouter = require('./router/messageRouter');
const userRouter = require('./router/userRouter');
const User = require('./model/userModel');
const Message = require('./model/messageModel');
const Group = require('./model/groupModel');
const GroupMsg = require('./model/groupMsgModel');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
    }
});

const corsOptions = {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
};

// Middleware for CORS
app.use(cors(corsOptions));
app.use(express.json());

const port = process.env.PORT || 3000;

app.use('/api/', messageRouter);
app.use('/api/', userRouter);

app.get('/api', (req, res) => {
    return res.send(`Welcome to Let's Chat Web App API!`);
});

// Middleware to authenticate token and set user in request
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('Access Denied');

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = await User.findById(decoded.userId);
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
}

const getAllUsersWithStatus = async () => {
    const users = await User.find({}).select('_id username online email createdAt avatar');
    return users.map(user => ({
        _id: user._id,
        username: user.username,
        online: user.online,
        email: user.email,
        createdAt: user.createdAt,
        avatar: user.avatar,
    }));
};

io.on('connection', (socket) => {
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.SECRET);
            const user = await User.findById(decoded.userId);
            user.online = true;
            await user.save();

            socket.user = user;
            socket.join(user._id.toString());
            io.emit('presence', { users: await getAllUsersWithStatus() });
        } catch (err) {
            console.error('Authentication error:', err.message);
        }
    });

    socket.on('joinGroup', async (groupId) => {
        const group = await Group.findById(groupId);
        if (group) {
            socket.join(groupId);
            socket.emit('messageHistory', group.messages);
        }
    });

    socket.on('sendMessage', async (message) => {
        try {
            const { to, message: text, isGroup, groupId } = message;
            const from = socket.user._id;

            if (isGroup && groupId) {
                const groupMessage = new GroupMsg({
                    group: groupId,
                    from: from,
                    message: text,
                    to: groupId
                });

                // Check if 'from' is not a member of 'to' group
                const group = await Group.findOne({ _id: groupId });
                if (!group.members.includes(from)) {
                    throw new Error("You are not a member of this group. Cannot send message.");
                }

                await groupMessage.save(); 

                await groupMessage.populate([
                    {
                        path: 'from',
                        select: '_id username'
                    },
                    {
                        path: 'to',
                        select: '_id name'
                    }
                ]).then(populatedGroupMessage => {
                    io.to(groupId).emit('newMessage', {
                        from: {
                            _id: populatedGroupMessage.from._id,
                            username: populatedGroupMessage.from.username
                        },
                        to: {
                            _id: populatedGroupMessage.to._id,
                            name: populatedGroupMessage.to.name
                        },
                        message: populatedGroupMessage.message,
                        sentTime: populatedGroupMessage.createdAt
                    });
                });
            } else {
                const newMessage = new Message({ from, to, message: text });
                await newMessage.save();

                await newMessage.populate([
                    {
                        path: 'from',
                        select: '_id username'
                    },
                    {
                        path: 'to',
                        select: '_id username'
                    }
                ]).then(populatedMessage => {
                    io.to(to.toString()).emit('message', {
                        from: {
                            _id: populatedMessage.from._id,
                            username: populatedMessage.from.username
                        },
                        to: {
                            _id: populatedMessage.to._id,
                            username: populatedMessage.to.username
                        },
                        message: populatedMessage.message,
                        sentTime: populatedMessage.createdAt
                    });
                });
            }
        } catch (err) {
            socket.emit('error', { message: 'Error sending message: ' + err.message });
        }
    });

    socket.on('disconnect', async () => {
        if (socket.user) {
            const user = await User.findById(socket.user.id);
            user.online = false;
            await user.save();

            io.emit('presence', { users: await getAllUsersWithStatus() });
        }
    });
});

// Serve static files from the 'chatWebApp-client/dist' directory
app.use(express.static(path.join(__dirname, "../chatWebApp-client/dist")));

// Route all other requests to the index.html file in 'chatWebApp-client/dist'
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../chatWebApp-client/dist/index.html"));
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});
