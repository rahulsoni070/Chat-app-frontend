# Chat App

A full-stack real-time chat application where users can register, see other users, and exchange private messages instantly. Includes typing indicators, read receipts (single tick, double tick, blue tick), message timestamps, and an emoji picker.

Built with a React frontend, Express/Node backend, MongoDB (Mongoose) database, Socket.IO for real-time communication, and JWT-based authentication.

## Demo Link

[Live Demo](https://chat-app-frontend-psi-roan.vercel.app/) • [Backend API](https://chat-app-backend-l65n.onrender.com/)

> Note: the backend runs on a free hosting tier and sleeps after inactivity. The first request may take up to 50 seconds to wake it up.

## Quick Start

This project has two folders: `frontend` and `backend`. (The frontend and backend are also in separate GitHub repos.)

### Backend

```
git clone https://github.com/rahulsoni070/Chat-app-backend.git
cd Chat-app-backend
npm install
npm start          # or: npm run dev (auto-restart)
```

Runs on `http://localhost:5001`

### Frontend

```
git clone https://github.com/rahulsoni070/Chat-app-frontend.git
cd Chat-app-frontend
npm install
npm start
```

Runs on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend with:

```
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
CLIENT_URL=http://localhost:3000   # comma-separate multiple origins
PORT=5001
```

The frontend falls back to `http://localhost:5001` automatically, so no `.env` is needed locally. For deployment, set `REACT_APP_API_URL` to the deployed backend URL.

## Technologies

* React JS
* Socket.IO (client and server)
* Node.js
* Express
* MongoDB (Mongoose)
* JWT (JSON Web Token)
* bcrypt
* Axios

## Features

### Authentication & Security

* Register and login with JWT
* Every REST route and the Socket.IO handshake verify the JWT; message senders come from the token, so nobody can send or read messages as someone else
* Password hashes are never sent to the client
* Passwords hashed with bcrypt before storage
* Login persists across page refreshes using localStorage
* Logout clears the session

### Real-Time Messaging

* Instant message delivery using Socket.IO
* Private one-to-one chats using Socket.IO rooms, so messages are only sent to the intended recipient
* Message history stored in MongoDB and loaded when a chat is opened

### Typing Indicator

* Shows "user is typing..." in real time
* Debounced so the indicator clears once the user actually stops typing
* Never stored in the database

### Read Receipts

* Single tick — message saved on the server
* Double tick — message delivered to the recipient's browser
* Blue tick — recipient opened the conversation

### Timestamps

* Every message stores `createdAt` in UTC
* Displayed in each user's own local timezone

### Emoji Picker

* Emoji panel next to the message input (loaded on demand, follows light/dark theme)
* Emojis are stored and delivered like normal text

### Modern, Responsive UI

* Works on phones, tablets and desktops — on phones the chat list and conversation are separate screens with a back button
* Automatic dark mode, colored initial avatars, online presence dots and unread badges
* Search people, multi-line messages (Shift+Enter), optimistic sending with a "failed" state

## API Reference

Auth routes are served under `/auth`. Every other route requires an `Authorization: Bearer <token>` header; requests without a valid token get `401`.

### Auth

`POST /auth/register` — Register a new user (username 3–30 characters, password at least 6)

Sample Response:

```
{ "message": "User registered successfully", "token": "...", "username": "..." }
```

`POST /auth/login` — Log in and receive a JWT

Sample Response:

```
{ "message": "Login successful", "token": "...", "username": "..." }
```

`GET /auth/me` — Returns the user the token belongs to

```
{ "username": "..." }
```

### Users

`GET /users` — List all users except the caller. Password hashes are never returned.

Sample Response:

```
[{ "_id": "...", "username": "...", "createdAt": "..." }, ...]
```

### Messages

`GET /messages?with=<username>` — The conversation between the caller and `<username>`, oldest first

Sample Response:

```
[{ "_id": "...", "sender": "...", "receiver": "...", "message": "...", "status": "read", "createdAt": "..." }, ...]
```

`GET /messages/unread` — Unread counts for the caller, keyed by sender

```
{ "bob": 2, "carol": 1 }
```

## Socket Events

The socket connection must pass the JWT: `io(API_URL, { auth: { token } })`. The server rejects the handshake without a valid token, and the sender of every event is taken from the token — any `sender` in a client payload is ignored.

### Client to Server

| Event | Payload | Purpose |
|---|---|---|
| `send_message` | `{ receiver, message }` + ack callback | Saves the message (max 2000 characters) and delivers it; the ack gets the saved message or `{ error }` |
| `message_delivered` | `{ messageId }` | Marks a message addressed to you as delivered (double tick) |
| `mark_as_read` | `{ sender }` | Marks messages from `sender` to you as read (blue tick) |
| `typing` | `{ receiver }` | Tells the receiver you are typing |
| `stop_typing` | `{ receiver }` | Clears the typing indicator |

### Server to Client

| Event | Payload | Purpose |
|---|---|---|
| `receive_message` | message object | A new message has arrived |
| `message_status_update` | `{ messageId, status }` | A message moved to delivered |
| `messages_read` | `{ sender, receiver }` | The recipient read the conversation |
| `user_typing` | `{ sender, receiver }` | Show the typing indicator |
| `user_stop_typing` | `{ sender, receiver }` | Hide the typing indicator |
| `online_users` | `[username, ...]` | Who is online, sent once on connect |
| `user_online` / `user_offline` | `username` | Presence changes |

## Tests

```
cd Chat-app-backend && npm test     # node:test — JWT checks on REST + sockets, no database needed
cd Chat-app-frontend && npm test    # Jest + React Testing Library
```

## Contact

For bugs or feature requests, please reach out to [rahulsoni66676@gmail.com](mailto:rahulsoni66676@gmail.com)
