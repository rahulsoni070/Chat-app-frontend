import React from "react";

const MessageList = ({ messages, user, formatTime }) => {
  const renderTick = (msg) => {
    if (msg.sender !== user.username) return null;
    if (msg.status === "sent") return <span className="tick">✓</span>;
    if (msg.status === "delivered") return <span className="tick">✓✓</span>;
    if (msg.status === "read")
      return <span className="tick read">✓✓</span>;
    return null;
  };

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div
          key={msg._id || msg.tempId || index}
          className={`message ${
            msg.sender === user.username ? "sent" : "received"
          }`}
        >
          <strong>{msg.sender}: </strong>
          {msg.message}
          <span className="msg-time">
            {formatTime(msg.createdAt)}
            {renderTick(msg)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MessageList;