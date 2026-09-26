import React, { useCallback, useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import { Chat } from "./components/Chat";
import {
  api,
  loadSession,
  saveSession,
  setAuthToken,
  setUnauthorizedHandler,
} from "./api";

const initialSession = loadSession();
setAuthToken(initialSession?.token);

const App = () => {
  const [session, setSession] = useState(initialSession);

  const updateSession = useCallback((next) => {
    setAuthToken(next?.token);
    saveSession(next);
    setSession(next);
  }, []);

  const handleLogout = useCallback(() => updateSession(null), [updateSession]);

  // Any 401 (expired or revoked token) sends the user back to the sign-in screen.
  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
  }, [handleLogout]);

  // Validate a token restored from a previous visit.
  useEffect(() => {
    if (initialSession) api.get("/auth/me").catch(() => {});
  }, []);

  return session ? (
    <Chat user={session} onLogout={handleLogout} />
  ) : (
    <AuthPage onAuth={updateSession} />
  );
};

export default App;
