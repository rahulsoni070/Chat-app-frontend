import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, api, errorMessage } from "../api";
import Avatar from "./Avatar";
import MessageList from "./MessageList";

// The emoji picker is large, so it is only downloaded the first time it is opened.
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const MAX_MESSAGE_LENGTH = 2000;

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export const Chat = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [unread, setUnread] = useState({});
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const currentChatRef = useRef(currentChat);
  currentChatRef.current = currentChat;

  // One authenticated socket per session; the server rejects it without a valid token.
  const socket = useMemo(
    () => io(API_URL, { auth: { token: user.token }, autoConnect: false }),
    [user.token]
  );

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setError("");
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err) => {
      setConnected(false);
      if (err.message === "unauthorized") onLogout();
      else setError("Connection lost. Reconnecting…");
    };

    const onReceive = (data) => {
      socket.emit("message_delivered", { messageId: data._id });

      if (data.sender === currentChatRef.current) {
        setMessages((prev) => [...prev, data]);
        setTypingUser("");
        socket.emit("mark_as_read", { sender: data.sender });
      } else {
        setUnread((prev) => ({ ...prev, [data.sender]: (prev[data.sender] || 0) + 1 }));
      }
    };

    const onStatusUpdate = ({ messageId, status }) =>
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId && m.status !== "read" ? { ...m, status } : m))
      );

    const onRead = ({ receiver }) =>
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user.username && m.receiver === receiver && m._id
            ? { ...m, status: "read" }
            : m
        )
      );

    const onTyping = ({ sender }) => {
      if (sender === currentChatRef.current) setTypingUser(sender);
    };
    const onStopTyping = ({ sender }) => {
      if (sender === currentChatRef.current) setTypingUser("");
    };

    const onOnlineList = (list) => setOnlineUsers(new Set(list));
    const onOnline = (name) => setOnlineUsers((prev) => new Set(prev).add(name));
    const onOffline = (name) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });

    const handlers = {
      connect: onConnect,
      disconnect: onDisconnect,
      connect_error: onConnectError,
      receive_message: onReceive,
      message_status_update: onStatusUpdate,
      messages_read: onRead,
      user_typing: onTyping,
      user_stop_typing: onStopTyping,
      online_users: onOnlineList,
      user_online: onOnline,
      user_offline: onOffline,
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    socket.connect();

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      socket.disconnect();
    };
  }, [socket, user.username, onLogout]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get("/users"), api.get("/messages/unread").catch(() => ({ data: {} }))])
      .then(([usersRes, unreadRes]) => {
        if (cancelled) return;
        setUsers(usersRes.data);
        setUnread(unreadRes.data || {});
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Could not load users.")))
      .finally(() => !cancelled && setLoadingUsers(false));

    return () => {
      cancelled = true;
    };
  }, [user.token]);

  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  // Close the conversation with Escape (handy on desktop, mirrors the back button on phones).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showEmoji) setShowEmoji(false);
      else setCurrentChat(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showEmoji]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? users.filter((u) => u.username.toLowerCase().includes(q)) : users;
    // Online people first, then alphabetical.
    return [...list].sort(
      (a, b) =>
        onlineUsers.has(b.username) - onlineUsers.has(a.username) ||
        a.username.localeCompare(b.username)
    );
  }, [users, search, onlineUsers]);

  const openChat = async (receiver) => {
    if (receiver === currentChat) return;

    stopTyping();
    setCurrentChat(receiver);
    setMessages([]);
    setTypingUser("");
    setShowEmoji(false);
    setCurrentMessage("");
    setLoadingMessages(true);
    setUnread((prev) => ({ ...prev, [receiver]: 0 }));

    try {
      const { data } = await api.get("/messages", { params: { with: receiver } });
      if (currentChatRef.current !== receiver) return;
      setMessages(data);
      setError("");
      socket.emit("mark_as_read", { sender: receiver });
    } catch (err) {
      setError(errorMessage(err, "Could not load messages."));
    } finally {
      setLoadingMessages(false);
    }

    // Don't pop the keyboard up on phones just from opening a chat.
    if (window.matchMedia?.("(min-width: 768px)").matches) inputRef.current?.focus();
  };

  const stopTyping = () => {
    if (!typingTimeout.current) return;
    clearTimeout(typingTimeout.current);
    typingTimeout.current = null;
    if (currentChatRef.current) {
      socket.emit("stop_typing", { receiver: currentChatRef.current });
    }
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    autoResize(e.target);

    if (!typingTimeout.current) socket.emit("typing", { receiver: currentChat });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 2500);
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const onEmojiClick = (emojiData) => {
    setCurrentMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    const text = currentMessage.trim();
    if (!text || !currentChat) return;

    const tempId = `${Date.now()}-${Math.random()}`;
    const draft = {
      sender: user.username,
      receiver: currentChat,
      message: text,
      createdAt: new Date().toISOString(),
      status: "sending",
      tempId,
    };

    setMessages((prev) => [...prev, draft]);
    setCurrentMessage("");
    setShowEmoji(false);
    stopTyping();
    requestAnimationFrame(() => autoResize(inputRef.current));

    socket
      .timeout(10000)
      .emit("send_message", { receiver: currentChat, message: text }, (err, saved) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.tempId !== tempId) return m;
            if (err || !saved || saved.error) return { ...m, status: "failed" };
            return saved;
          })
        );
        if (saved?.error) setError(saved.error);
      });
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      sendMessage(e);
    }
  };

  const totalUnread = Object.values(unread).reduce((sum, n) => sum + n, 0);
  const chatStatus = typingUser
    ? "typing…"
    : onlineUsers.has(currentChat)
    ? "Online"
    : "Offline";

  return (
    <div className={`chat-shell ${currentChat ? "show-chat" : ""}`}>
      <aside className="sidebar" aria-label="Conversations">
        <header className="sidebar-header">
          <div className="me">
            <Avatar name={user.username} online={connected} />
            <div className="me-text">
              <strong>{user.username}</strong>
              <small className={connected ? "status-online" : ""}>
                {connected ? "Online" : "Connecting…"}
              </small>
            </div>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Log out" aria-label="Log out">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 17l5-5-5-5M20 12H9M12 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7" />
            </svg>
          </button>
        </header>

        <div className="sidebar-title">
          <h2>Chats</h2>
          {totalUnread > 0 && <span className="badge">{totalUnread}</span>}
        </div>

        <div className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search people"
          />
        </div>

        <ul className="user-list">
          {loadingUsers &&
            [0, 1, 2, 3].map((i) => (
              <li key={i} className="user-row skeleton" aria-hidden="true">
                <span className="avatar avatar-md" />
                <span className="skeleton-line" />
              </li>
            ))}

          {!loadingUsers && filteredUsers.length === 0 && (
            <li className="empty-note">
              {search ? "No one matches that search." : "No other users yet — invite a friend!"}
            </li>
          )}

          {filteredUsers.map((u) => {
            const online = onlineUsers.has(u.username);
            const count = unread[u.username] || 0;
            return (
              <li key={u._id}>
                <button
                  type="button"
                  className={`user-row ${currentChat === u.username ? "active" : ""}`}
                  onClick={() => openChat(u.username)}
                  aria-current={currentChat === u.username ? "true" : undefined}
                >
                  <Avatar name={u.username} online={online} />
                  <span className="user-meta">
                    <span className="user-name">{u.username}</span>
                    <span className="user-sub">{online ? "Online" : "Offline"}</span>
                  </span>
                  {count > 0 && (
                    <span className="badge" aria-label={`${count} unread`}>
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="chat-pane" aria-label="Conversation">
        {!currentChat ? (
          <div className="chat-empty">
            <div className="chat-empty-art">💬</div>
            <h2>Your messages</h2>
            <p>Pick someone from the list to start a conversation.</p>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <button
                className="icon-btn back-btn"
                onClick={() => setCurrentChat(null)}
                aria-label="Back to chats"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <Avatar name={currentChat} online={onlineUsers.has(currentChat)} />
              <div className="chat-header-text">
                <strong>{currentChat}</strong>
                <small className={typingUser ? "status-typing" : ""}>{chatStatus}</small>
              </div>
            </header>

            {error && (
              <p className="alert alert-inline" role="alert">
                {error}
              </p>
            )}

            <MessageList
              messages={messages}
              user={user}
              loading={loadingMessages}
              typingUser={typingUser}
            />

            <form className="composer" onSubmit={sendMessage}>
              {showEmoji && (
                <div className="emoji-box">
                  <Suspense fallback={<div className="emoji-loading">Loading emoji…</div>}>
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={prefersDark() ? "dark" : "light"}
                      width="100%"
                      height={360}
                      emojiStyle="native"
                      lazyLoadEmojis
                      previewConfig={{ showPreview: false }}
                    />
                  </Suspense>
                </div>
              )}

              <button
                type="button"
                className={`icon-btn emoji-btn ${showEmoji ? "active" : ""}`}
                onClick={() => setShowEmoji((prev) => !prev)}
                aria-label="Emoji"
                aria-expanded={showEmoji}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01" />
                </svg>
              </button>

              <textarea
                ref={inputRef}
                rows={1}
                placeholder={`Message ${currentChat}`}
                value={currentMessage}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                aria-label="Message"
              />

              <button
                type="submit"
                className="send-btn"
                disabled={!currentMessage.trim()}
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </section>

      {!currentChat && error && (
        <p className="alert alert-toast" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
