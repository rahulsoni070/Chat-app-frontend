import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import { Chat } from "./components/Chat";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("chatUser");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleSetUser = (data) => {
    setUser(data);
    localStorage.setItem("chatUser", JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("chatUser");
  };

  return (
    <div className="app">
      <h1>Chat App</h1>
      {!user ? (
        <div className="container mt-5 text-center">
          <div className="row">
            <div className="col-md-6">
              <Register setUser={handleSetUser} />
            </div>
            <div className="col-md-6">
              <Login setUser={handleSetUser} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
          <Chat user={user} />
        </>
      )}
    </div>
  );
};

export default App;