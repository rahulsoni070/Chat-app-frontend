import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/auth/login`, {
        username,
        password,
      });
      setUser(data);
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card py-5 text-center">
      <div className="card-body px-5">
        <h2>Login</h2>
        <p>Login with your credentials to continue.</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          className="form-control form-control-lg mt-3"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="form-control form-control-lg mt-3"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          className="btn btn-success btn-lg mt-3"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="msg-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;