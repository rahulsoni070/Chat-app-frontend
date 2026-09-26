import React, { useEffect, useRef } from "react";

const formatTime = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const TICKS = {
  sending: { label: "Sending", icon: "🕓" },
  sent: { label: "Sent", icon: "✓" },
  delivered: { label: "Delivered", icon: "✓✓" },
  read: { label: "Read", icon: "✓✓" },
  failed: { label: "Failed to send", icon: "!" },
};

const Tick = ({ status }) => {
  const tick = TICKS[status];
  if (!tick) return null;
  return (
    <span className={`tick tick-${status}`} title={tick.label} aria-label={tick.label}>
      {tick.icon}
    </span>
  );
};

const MessageList = ({ messages, user, loading = false, typingUser = "" }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, typingUser]);

  return (
    <div className="message-list" role="log" aria-live="polite">
      {loading && <p className="empty-note">Loading messages…</p>}

      {!loading && messages.length === 0 && (
        <p className="empty-note">No messages yet. Say hi 👋</p>
      )}

      {messages.map((msg, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const mine = msg.sender === user.username;
        const sameDay = (a, b) =>
          a && b && new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString();
        const showDate = !sameDay(prev, msg);
        // Consecutive bubbles from the same person are visually grouped.
        const lastInGroup = !next || next.sender !== msg.sender || !sameDay(msg, next);

        return (
          <React.Fragment key={msg._id || msg.tempId || index}>
            {showDate && <div className="date-divider">{formatDate(msg.createdAt)}</div>}

            <div
              className={`message ${mine ? "sent" : "received"} ${lastInGroup ? "tail" : ""} ${
                msg.status === "failed" ? "failed" : ""
              }`}
            >
              <span className="message-text">{msg.message}</span>
              <span className="msg-meta">
                {formatTime(msg.createdAt)}
                {mine && <Tick status={msg.status} />}
              </span>
            </div>
          </React.Fragment>
        );
      })}

      {typingUser && (
        <div className="message received tail typing-bubble" aria-label={`${typingUser} is typing`}>
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
