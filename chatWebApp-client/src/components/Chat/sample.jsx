

import React, { useState, useEffect, useRef } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { RiSearchLine, RiFileAddFill } from "react-icons/ri";
import { MdSend, MdMenu, MdEmojiEmotions, MdDelete, MdArrowBack } from 'react-icons/md';
import { BiSolidGroup } from "react-icons/bi";
import { HiMiniUserGroup } from "react-icons/hi2";
import { FaUserPlus } from "react-icons/fa6";
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import typingAnimation from "../TypingEffect/typing.json";
import './Chat.css';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [view, setView] = useState('sidebar'); // 'sidebar' or 'chat'
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  let parsedToken = null;
  try {
    parsedToken = token ? JSON.parse(token) : null;
  } catch (error) {
    toast.error('Error parsing token: ' + (error.response?.data?.message || error.message));
    console.error('Error parsing token:', error);
    parsedToken = null;
  }

  const user = localStorage.getItem('userData');

  let parsedUser = null;
  try {
    parsedUser = user ? JSON.parse(user) : null;
    const userId = parsedUser ? parsedUser.userId : null;
  } catch (error) {
    toast.error('Error parsing user data: ' + (error.response?.data?.message || error.message));
    console.error('Error parsing user data:', error);
    parsedUser = null;
  }

  const [socket, setSocket] = useState(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null); // Add a ref to handle typing timeout
  const messagesEndRef = useRef(null); // Ref to handle scrolling to the end

  useEffect(() => {
    if (!parsedToken) {
      navigate('/login-signup');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/allusers', {
          headers: {
            'Authorization': `Bearer ${parsedToken}`
          }
        });
        setAllUsers(response.data.users);
      } catch (error) {
        toast.error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await axios.get('/api/groups', {
          headers: {
            'Authorization': `Bearer ${parsedToken}`
          }
        });
        setGroups(response.data);
      } catch (error) {
        toast.error('Failed to fetch groups: ' + (error.response?.data?.message || error.message));
      }
    };

    fetchUsers();
    fetchGroups();
  }, [parsedToken, navigate]);

  useEffect(() => {
    if (!parsedToken) return;

    const newSocket = io('https://chatglow.onrender.com/', {
      query: { token: parsedToken }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('connected to server');
      newSocket.emit('authenticate', parsedToken);
    });

    newSocket.on('disconnect', () => {
      console.log('disconnected from server');
    });

    newSocket.on('presence', (data) => {
      setAllUsers(data.users);
    });

    newSocket.on('message', (message) => {
      setMessages((prevMessages) => [ ...prevMessages, message ]);
    });

    newSocket.on('newMessage', (message) => {
      setMessages((prevMessages) => [ ...prevMessages, message ]);
    });

    // Listen for typing events
    newSocket.on('typing', (data) => {
      setIsTyping(data.to);
    });

    newSocket.on('stopTyping', (data) => {
      setIsTyping(null);
    });

    // Handle 'error' event from server
    newSocket.on('error', async (error) => {
      toast.error('An error occurred: ' + error.message);
      await fetchStoredMessages(); // Reload messages here
    });

    return () => {
      newSocket.off('presence');
      newSocket.off('message');
      newSocket.off('newMessage');
      newSocket.off('typing');
      newSocket.off('stopTyping');
      newSocket.off('error');
      newSocket.disconnect();
    };
  }, [parsedToken, navigate]);

  useEffect(() => {
    const fetchStoredMessages = async () => {
      try {
        if (selectedUser) {
          const response = await axios.get(`/api/getmessage/${selectedUser._id}`, {
            headers: {
              'Authorization': `Bearer ${parsedToken}`
            }
          });

          const receivedMessages = response.data.data;

          setMessages(receivedMessages);

        } else if (selectedGroup) {
          const response = await axios.get(`/api/get-group-messages/${selectedGroup._id}`, {
            headers: {
              'Authorization': `Bearer ${parsedToken}`
            }
          });

          const receivedMessages = response.data.data;

          setMessages(receivedMessages);

          socket.emit('joinGroup', selectedGroup._id);
        }
      } catch (error) {
        toast.error('Failed to fetch stored messages: ' + (error.response?.data?.message || error.message));
      }
    };

    fetchStoredMessages();
  }, [parsedToken, selectedUser, selectedGroup]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, istyping]);

  const sendMessage = async () => {
    try {
      if (!selectedUser && !selectedGroup) {
        toast.error('No user or group selected to send message to');
        return;
      }

      const messageData = selectedUser
        ? { to: selectedUser._id, message }
        : { isGroup: true, groupId: selectedGroup._id, to: selectedGroup._id, message };

      socket.emit('sendMessage', messageData);

      if (messageData.message === "") {
        toast.error('Please enter a message!!!');
        return;
      }

      setMessages(prevMessages => [
        ...prevMessages,
        {
          from: { _id: parsedUser.userId, username: parsedToken.username },
          to: selectedUser ? { _id: selectedUser._id, username: selectedUser.username } : { _id: selectedGroup._id, name: selectedGroup.name },
          message: messageData.message,
          sentTime: new Date().toISOString()
        }
      ]);
      setMessage('');
    } catch (error) {
      await fetchStoredMessages();  // Reload messages here
      toast.error('Failed to send message: ' + (error.response?.data?.message || error.message));
    }
  };

  // fetchStoredMessages is defined in the component scope to be used
  const fetchStoredMessages = async () => {
    try {
      if (selectedUser) {
        const response = await axios.get(`/api/getmessage/${selectedUser._id}`, {
          headers: {
            'Authorization': `Bearer ${parsedToken}`
          }
        });

        const receivedMessages = response.data.data;

        setMessages(receivedMessages);

      } else if (selectedGroup) {
        const response = await axios.get(`/api/get-group-messages/${selectedGroup._id}`, {
          headers: {
            'Authorization': `Bearer ${parsedToken}`
          }
        });

        const receivedMessages = response.data.data;

        setMessages(receivedMessages);

        socket.emit('joinGroup', selectedGroup._id);
      }
    } catch (error) {
      toast.error('Failed to fetch stored messages: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit('typing', { to: selectedUser ? selectedUser._id : selectedGroup._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('stopTyping', { to: selectedUser ? selectedUser._id : selectedGroup._id });
    }, 3000);
  };

  const addEmoji = (emojiData) => {
    setMessage((prevInput) => prevInput + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
    setView(isSidebarVisible ? 'chat' : 'sidebar');
  };

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewGroupCreation = async () => {
    try {
      const response = await axios.post('/api/groups', {
        name: newGroupName
      }, {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      setGroups(prevGroups => [...prevGroups, response.data]);
      setNewGroupName('');
    } catch (error) {
      toast.error('Failed to create group: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGroupDeletion = async (groupId) => {
    try {
      const response = await axios.delete(`/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      setGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
      setSelectedGroup(null);
      setMessages([]);
    } catch (error) {
      toast.error('Failed to delete group: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="chat-app">
      <div className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <RiSearchLine className="search-icon" />
        </div>
        <div className="user-list">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className={`user-item ${selectedUser && selectedUser._id === user._id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroup(null);
                setMessages([]);  // Clear previous messages
                fetchStoredMessages();
              }}
            >
              {user.username}
            </div>
          ))}
        </div>
        <div className="group-list">
          <h3>Groups</h3>
          {groups.map((group) => (
            <div
              key={group._id}
              className={`group-item ${selectedGroup && selectedGroup._id === group._id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedGroup(group);
                setSelectedUser(null);
                setMessages([]);  // Clear previous messages
                fetchStoredMessages();
              }}
            >
              {group.name}
              <MdDelete
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGroupDeletion(group._id);
                }}
              />
            </div>
          ))}
          <div className="new-group">
            <input
              type="text"
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <RiFileAddFill className="add-icon" onClick={handleNewGroupCreation} />
          </div>
        </div>
      </div>
      <div className={`chat-container ${view === 'chat' ? 'chat-only' : ''}`}>
        <div className="header">
          <div className="menu-icon" onClick={toggleSidebar}>
            {view === 'sidebar' ? <MdMenu /> : <MdArrowBack />}
          </div>
          <div className="chat-title">
            {selectedUser ? selectedUser.username : (selectedGroup ? selectedGroup.name : 'Chat')}
          </div>
        </div>
        <div className="messages" ref={messageContainerRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.from._id === parsedUser.userId ? 'my-message' : 'user-message'}`}
            >
              <div className="message-content">
                {msg.message}
              </div>
              <small>{msg.from.username}</small>
            </div>
          ))}
          {istyping && (
            <div className="message typing-indicator">
              <div className="message-content">
                <img src={typingAnimation} alt="Typing..." />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-bar">
          <MdEmojiEmotions className="emoji-icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
          {showEmojiPicker && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={addEmoji} />
            </div>
          )}
          <textarea
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <MdSend className="send-icon" onClick={sendMessage} />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Chat;
