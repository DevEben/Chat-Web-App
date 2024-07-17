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
      setMessages((prevMessages) => [message, ...prevMessages]);
    });

    newSocket.on('newMessage', (message) => {
      setMessages((prevMessages) => [message, ...prevMessages]);
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

      // setMessages(prevMessages => [
      //   {
      //     from: { _id: parsedUser.userId, username: parsedToken.username },
      //     to: selectedUser ? { _id: selectedUser._id, username: selectedUser.username } : { _id: selectedGroup._id, name: selectedGroup.name },
      //     message: messageData.message,
      //     sentTime: new Date().toISOString()
      //   },
      //   ...prevMessages
      // ]);


      if (selectedUser) {
        setMessages(prevMessages => [
          {
            from: { _id: parsedUser.userId, username: parsedToken.username },
            to: { _id: selectedUser._id, username: selectedUser.username },
            message: messageData.message,
            sentTime: new Date().toISOString()
          },
          ...prevMessages
        ]);
      }

      setMessage('');
    } catch (error) {
      await fetchStoredMessages();  // Reload messages here
      toast.error('Failed to send message: ' + (error.response?.data?.message || error.message));
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


  const handleUserClick = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setView('chat'); // Switch to chat view on mobile
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setView('chat'); // Switch to chat view on mobile
  };

  const createGroup = async (userId) => {
    try {
      const response = await axios.post(`/api/create-groups/${userId}`, { name: newGroupName }, {
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

  const joinGroup = async (groupId) => {
    try {
      const res = await axios.post('/api/join-group', { groupId }, {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      const response = await axios.get('/api/groups', {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      toast.success((res?.data?.message));
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to join group: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteGroup = async (groupId, userId) => {
    try {
      const res = await axios.delete(`/api/delete-group/${groupId}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      const response = await axios.get('/api/groups', {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });
      const response2 = await axios.get(`/api/get-group-messages/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${parsedToken}`
        }
      });

      toast.success((res?.data?.message));
      setGroups(response.data);
      setMessages(response2.data);
    } catch (error) {
      toast.error('Failed to delete group: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredUsers = allUsers.filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleInputHeightChange = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const onEmojiClick = (event) => {
    const emoji = event.emoji;
    setMessage((prevMessage) => prevMessage + emoji);
    setShowEmojiPicker(false);
  };

  const goBackToSidebar = () => {
    setView('sidebar');
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${view === 'sidebar' ? '' : 'hide'}`}>
        <div className="sidebar-content">
          <div className="search-container" style={{ width: "100%", borderBottom: '1px solid #ccc', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 40px 10px 10px', marginBottom: '10px', borderRadius: '100px', border: '1px solid #ccc', outline: "none", width: '100%' }}
            />
            <RiSearchLine style={{ position: 'absolute', right: '10px', top: '40%', transform: 'translateY(-50%)', color: '#888' }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "20px" }}>
              <BiSolidGroup style={{ fontSize: "25px" }} />
              <h3 style={{ marginLeft: "5px" }}>Users</h3>
            </div>
            <ul>
              {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                <li key={user._id}
                  onClick={() => handleUserClick(user)}
                  style={{ cursor: 'pointer', marginBottom: '5px', backgroundColor: selectedUser && selectedUser._id === user._id ? '#bee7f4' : 'inherit', color: selectedUser && selectedUser._id === user._id ? '#5089C6' : 'inherit', borderRadius: "10px", paddingInline: "10px", display: 'flex', alignItems: 'center', gap: "5px" }}>
                  <div className="avatarImage">
                    <img src={user.avatar.url} alt="avatar" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "5px" }}>
                    {user.username}
                    {user.online && (
                      <span style={{ marginLeft: '5px', height: '7px', width: '7px', backgroundColor: '#32CD32', borderRadius: '50%', display: 'inline-block' }}></span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "center", marginTop: "20px" }}>
              <HiMiniUserGroup style={{ fontSize: "25px" }} />
              <h3 style={{ marginLeft: "5px" }}>Groups</h3>
            </div>
            <ul>
              {Array.isArray(filteredGroups) && filteredGroups.map((group) => (
                <li key={group._id}
                  onClick={() => handleGroupClick(group)}
                  style={{ cursor: 'pointer', marginBottom: '5px', backgroundColor: selectedGroup && selectedGroup._id === group._id ? '#bee7f4' : 'inherit', color: selectedGroup && selectedGroup._id === group._id ? '#5089C6' : 'inherit', borderRadius: "10px", paddingInline: "10px", display: 'flex', alignItems: 'center', gap: "7px" }}>
                  {group.name}
                  <FaUserPlus onClick={() => joinGroup(group._id)} />
                  <MdDelete onClick={() => deleteGroup(group._id, parsedUser.userId)} />
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "20px" }}>
              <h3>Create Group</h3>
              <div style={{ width: "90%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name"
                  style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ccc', outline: 'none', width: '80%' }}
                />
                <button onClick={() => createGroup(parsedUser.userId)} style={{ display: "flex", justifyContent: "center", alignItems: "center", background: '#099cc9', color: 'white', fontSize: "26px", border: "2px solid #BAEDFC", borderRadius: "10px", width: "20%", height: "40px", marginLeft: '10px' }}><RiFileAddFill /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Chat container */}
      <div className={`chat-main ${view === 'chat' ? '' : 'hide'}`}>
        {(selectedUser || selectedGroup) ? (
          <div className="chat-header">
            <MdArrowBack className="back-button" onClick={goBackToSidebar} />
            <div className="avatarImage2">
              {selectedUser ? <img src={selectedUser.avatar.url} alt="avatar" /> : ""}
            </div>
            <h2>{selectedUser ? selectedUser.username : selectedGroup.name}</h2>
          </div>
        ) : (
          <div style={{ height: "100%", width: "100%", display: "flex", justifyContent: 'center', alignItems: "center", color: '#099cc9', fontWeight: "700" }}>Select a user or group to start chatting</div>
        )}
        {/* Message container */}
        <div ref={messageContainerRef} className="message-container">
        {(selectedUser || selectedGroup) && (istyping && (
            <div className={`typing-indicator ${selectedUser
              ? (istyping === selectedUser._id ? 'my-message' : 'user-message')
              : (selectedGroup ? (istyping === selectedGroup._id ? 'user-message' : 'my-message') : '')}`}
            ref={ istyping ? messagesEndRef : null }
            >
              {`Typing...`}
            </div>
          ))}
          {(selectedUser || selectedGroup) && (
            Array.isArray(messages) && messages.map((msg, index) => (
              msg && msg.from && (
                <div key={index} className={`message ${msg.from._id === parsedUser.userId ? 'my-message' : 'user-message'}`}
                  ref={index === 0 ? messagesEndRef : null} // Attach ref to last message
                >
                  {selectedGroup && (
                    <div className='username-container'>
                      <small>{msg.from.username}</small>
                    </div>
                  )}
                  {msg.message}
                  <br />
                  <div className='time-container'>
                    <small>{new Date(msg.sentTime).toLocaleTimeString()}</small>
                  </div>
                </div>
              )
            ))
          )}
          <div ref={messagesEndRef}></div>
        </div>
        {/* Input field and send button */}
        {(selectedUser || selectedGroup) && (
          <div className="message-input-container">
            <div className="emoji-picker-container">
              <div onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
              {showEmojiPicker && (
                <div className="emoji-picker">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
            <div className="message-input">
              <button
                onClick={() => setShowEmojiPicker((val) => !val)}
                style={{ background: 'none', color: '#1E9FAB' }}
                className="emoji-button"
              >
                <MdEmojiEmotions />
              </button>
              <textarea
                id='message-input'
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleInputHeightChange(e);
                  handleTyping(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                style={{
                  padding: '10px',
                  paddingLeft: '20px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'none',
                  overflowY: 'hidden',
                  outline: 'none',
                  width: '82%',
                  resize: 'none',
                  minHeight: '15px',
                  maxHeight: '40px'
                }}
                placeholder="Type your message here"
              />
              <button
                style={{ background: 'none', color: '#1E9FAB' }}
                id='send-button'
                onClick={sendMessage}
                className="send-button"
              >
                <MdSend />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* <ToastContainer /> */}
    </div>
  );
};

export default Chat;
