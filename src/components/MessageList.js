import React from "react";

const MessageList = ({ messages, user, formatTime }) => {
  const renderTick = (msg) => {
    if (msg.sender !== user.username) return null;
    if (msg.status === "sent") return <span className="tick">✓</span>;
    if (msg.status === "delivered") return <span className="tick">✓✓</span>;
    if (msg.status === "read") return <span className="tick read">✓✓</span>;
    return null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  return (
    <div className="message-list">
      {messages.map((msg, index) => {
        const prev = messages[index - 1];
        const showDate =
          !prev ||
          new Date(prev.createdAt).toDateString() !==
            new Date(msg.createdAt).toDateString();

        return (
          <React.Fragment key={msg._id || msg.tempId || index}>
            {showDate && (
              <div className="date-divider">{formatDate(msg.createdAt)}</div>
            )}

            <div
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
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;