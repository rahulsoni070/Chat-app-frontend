import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const socket = io(API);

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState("");
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.emit("join", user.username);

    socket.on("connect", () => {
      socket.emit("join", user.username);
    });

    return () => {
      socket.off("connect");
    };
  }, [user.username]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API}/users`, {
          params: { currentUser: user.username },
        });
        setUsers(data);
      } catch (error) {
        setError("Could not load users. Is the server running?");
      }
    };

    fetchUsers();

    socket.on("receive_message", (data) => {
      if (data.receiver !== user.username) return;

      socket.emit("message_delivered", { messageId: data._id });

      if (data.sender === currentChat) {
        setMessages((prev) => [...prev, data]);
        socket.emit("mark_as_read", {
          sender: data.sender,
          receiver: user.username,
        });
      }
    });

    socket.on("message_status_update", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      );
    });

    socket.on("messages_read", ({ sender }) => {
      if (sender !== user.username) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user.username ? { ...m, status: "read" } : m
        )
      );
    });

    socket.on("user_typing", (data) => {
      if (data.sender === currentChat) {
        setTypingUser(data.sender);
      }
    });

    socket.on("user_stop_typing", (data) => {
      if (data.sender === currentChat) {
        setTypingUser("");
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_status_update");
      socket.off("messages_read");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [currentChat, user.username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (receiver) => {
    try {
      const { data } = await axios.get(`${API}/messages`, {
        params: { sender: user.username, receiver },
      });
      setMessages(data);
      setCurrentChat(receiver);
      setTypingUser("");
      setShowEmoji(false);
      setError("");

      socket.emit("mark_as_read", {
        sender: receiver,
        receiver: user.username,
      });
    } catch (error) {
      setError("Could not load messages.");
    }
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);

    socket.emit("typing", {
      sender: user.username,
      receiver: currentChat,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", {
        sender: user.username,
        receiver: currentChat,
      });
    }, 3000);
  };

  const onEmojiClick = (emojiData) => {
    setCurrentMessage((prev) => prev + emojiData.emoji);
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    setShowEmoji(false);

    const tempId = Date.now();

    const messageData = {
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
      createdAt: new Date().toISOString(),
      status: "sending",
      tempId,
    };

    setMessages((prev) => [...prev, messageData]);
    setCurrentMessage("");

    clearTimeout(typingTimeout.current);
    socket.emit("stop_typing", {
      sender: user.username,
      receiver: currentChat,
    });

    socket.emit("send_message", messageData, (savedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? savedMessage : m))
      );
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>

      <div className="chat-list">
        <h3>Chats</h3>
        {users.length === 0 && <p className="empty-note">No users yet</p>}
        {users.map((u) => (
          <div
            key={u._id}
            className={`chat-user ${
              currentChat === u.username ? "active" : ""
            }`}
            onClick={() => fetchMessages(u.username)}
            title={u.username}
          >
            {u.username}
          </div>
        ))}
      </div>

      {error && <p className="msg-error">{error}</p>}

      {!currentChat && (
        <div className="chat-window">
          <p className="empty-note">Select a chat to start messaging</p>
        </div>
      )}

      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>

          <MessageList messages={messages} user={user} formatTime={formatTime} />
          <div ref={bottomRef} />

          <p className="typing-indicator">
            {typingUser ? `${typingUser} is typing...` : ""}
          </p>

          <div className="message-field">
            <button
              className="emoji-btn"
              onClick={() => setShowEmoji((prev) => !prev)}
            >
              😀
            </button>

            {showEmoji && (
              <div className="emoji-box">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  height={350}
                  width={300}
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};