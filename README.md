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
node index.js
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
CLIENT_URL=http://localhost:3000
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
* Bootstrap

## Features

### Authentication

* Register and login with JWT
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

* Emoji panel next to the message input
* Emojis are stored and delivered like normal text

## API Reference

Auth routes are served under `/auth`. Message and user routes are served at the root.

### Auth

`POST /auth/register` — Register a new user

Sample Response:

```
{ "message": "User registered successfully", "token": "...", "username": "..." }
```

`POST /auth/login` — Log in and receive a JWT

Sample Response:

```
{ "message": "Login successful", "token": "...", "username": "..." }
```

### Users

`GET /users?currentUser=<username>` — List all users except the current one

Sample Response:

```
[{ "_id": "...", "username": "...", "createdAt": "..." }, ...]
```

### Messages

`GET /messages?sender=<username>&receiver=<username>` — Get the full conversation between two users, sorted oldest first

Sample Response:

```
[{ "_id": "...", "sender": "...", "receiver": "...", "message": "...", "status": "read", "createdAt": "..." }, ...]
```

## Socket Events

### Client to Server

| Event | Payload | Purpose |
|---|---|---|
| `join` | `username` | Joins a room named after the user so messages can be addressed to them |
| `send_message` | `{ sender, receiver, message }` | Saves the message and delivers it to the receiver |
| `message_delivered` | `{ messageId }` | Marks a message as delivered (double tick) |
| `mark_as_read` | `{ sender, receiver }` | Marks a conversation as read (blue tick) |
| `typing` | `{ sender, receiver }` | Tells the receiver the sender is typing |
| `stop_typing` | `{ sender, receiver }` | Clears the typing indicator |

### Server to Client

| Event | Payload | Purpose |
|---|---|---|
| `receive_message` | message object | A new message has arrived |
| `message_status_update` | `{ messageId, status }` | A message moved to delivered |
| `messages_read` | `{ sender, receiver }` | The recipient read the conversation |
| `user_typing` | `{ sender }` | Show the typing indicator |
| `user_stop_typing` | `{ sender }` | Hide the typing indicator |

## Contact

For bugs or feature requests, please reach out to [rahulsoni66676@gmail.com](mailto:rahulsoni66676@gmail.com)
