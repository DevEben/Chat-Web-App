const messageModel = require('../model/messageModel');
const userModel = require('../model/userModel');
const groupModel = require('../model/groupModel');
const groupMsgModel = require('../model/groupMsgModel');



const sendMessage = async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                message: "Please enter a message!!"
            })
        }

        if (message === "") {
            return res.status(400).json({
                message: "Please enter a message!!"
            })
        }
        const newMessage = new messageModel({
            from: req.user.id,
            to,
            message
        });

        if (!newMessage) {
            return res.status(400).json({
                message: "Unable to send message!"
            })
        }

        const savedMessage = await newMessage.save();
        return res.status(200).json({
            message: "Message sent successfully!",
            data: savedMessage
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        })
    }
};




const getMessages = async (req, res) => {
    try {
        const { id } = req.params;

        const messages = await messageModel.find({
            $or: [
                { $and: [{ from: req.user.userId }, { to: id }] }, // Messages sent by logged-in user to the selected friend
                { $and: [{ from: id }, { to: req.user.userId }] }  // Messages sent by the selected friend to the logged-in user
            ]
        })
            .populate('from', 'username')
            .populate('to', 'username')
            .sort({ createdAt: -1 });

        return res.json({ data: messages });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


// Function to create group
const createGroup = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Please enter the name of the group!"
            });
        }

        const checkGroup = await groupModel.findOne({name: name});
        if (checkGroup) {
            return res.status(400).json({
                message: `Group named: ${name} already exists!`
            })
        }

        const group = new groupModel({ name: name.trim(), createdBy: userId });
        await group.save();

        return res.status(201).json(group);

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


// Function get all groups  
const getGroup = async (req, res) => {
    try {
        const groups = await groupModel.find().populate('members', 'username');

        if (!groups) {
            return res.status(400).json({
                message: "No groups found!"
            })
        }

        return res.status(200).json(groups);

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};

//Function to handle delete group 
const deleteGroup = async (req, res) => {
    try {
        const userId = req.params.userId;
        const groupId = req.params.groupId;
        const group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if the requesting user is the creator of the group
        if (!group.createdBy.equals(userId)) {
            return res.status(403).json({
                message: "You are not authorized to delete this group"
            });
        }

        const deletedGroup = await groupModel.findByIdAndDelete(groupId);
        if (!deletedGroup) {
            return res.status(400).json({
                message: "Unable to delete group from database!"
            });
        }

        const deletedGroupMessages = await groupMsgModel.deleteMany({ group: groupId });
        if (!deletedGroupMessages) {
            return res.status(400).json({
                message: "Unable to delete group messages"
            });
        }

        return res.status(200).json({
            message: "Group deleted successfully!"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


// Function to join group
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                message: "No group Id was gotten!"
            })
        }
        const group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(404).json('Group not found!');
        }

        if (!group.members.includes(req.user.userId)) {
            group.members.push(req.user.userId);
            await group.save();
        } else {
            return res.status(400).json({
                message: "user already joined the group!!"
            })
        }
        return res.status(200).json({
            message: "User successfully joined group!", 
            group
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


const sendGroupMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { from, message } = req.body;

        // Check if 'from' is not a member of 'to' group
        const group = await groupModel.findOne({ _id: to, members: userId });
        if (!group) {
            return res.status(403).json({
                message: "You are not a member of this group. Cannot send message."
            });
        }

        if (!from || !message) {
            return res.status(400).json({
                message: "Please enter a message!!"
            })
        }

        if (message === "") {
            return res.status(400).json({
                message: "Please enter a message!!"
            })
        }
        const newMessage = new groupMsgModel({
            from,
            message,
            to,
        });

        if (!newMessage) {
            return res.status(400).json({
                message: "Unable to send message!"
            })
        }

        const savedMessage = await newMessage.save();
        return res.status(200).json({
            message: "Message sent to group successfully!",
            data: savedMessage
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        })
    }
};



const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;

        const messages = await groupMsgModel.find({
            group: id
        })
            .populate('group', 'name')
            .populate('from', 'username')
            .populate('to', 'name')
            .sort({ createdAt: -1 });

        return res.json({ data: messages });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};



module.exports = {
    sendMessage,
    getMessages,
    createGroup,
    getGroup,
    deleteGroup,
    joinGroup,
    sendGroupMessage, 
    getGroupMessages,
}