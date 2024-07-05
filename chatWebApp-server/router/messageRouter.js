const express = require('express');

const router = express.Router();

const { sendMessage, getMessages, createGroup, getGroup, deleteGroup, joinGroup, sendGroupMessage, getGroupMessages, } = require('../controller/messageController');
const { authenticate, } = require("../middleware/authentation");

// endpoint to send a send a message to a user
router.post('/message', authenticate, sendMessage);

// Endpoint to get a particular user's messages 
router.get('/getmessage/:id', authenticate, getMessages);

// endpoint to create a group
router.post('/create-groups/:userId', authenticate, createGroup);

// endpoint to view all group
router.get('/groups', authenticate, getGroup);

// endpoint to delete a group
router.delete('/delete-group/:groupId/:userId', authenticate, deleteGroup);

// endpoint to join a group
router.post('/join-group', authenticate, joinGroup);

// endpoint to send a message to a group
router.post('/group-message', authenticate, sendGroupMessage);

// endpoint to get a particular group messages
router.get('/get-group-messages/:id', authenticate, getGroupMessages);


module.exports = router;