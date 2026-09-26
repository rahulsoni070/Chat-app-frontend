import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { io } from "socket.io-client";
import App from "./App";
import { api } from "./api";
import { createFakeSocket } from "./test-utils/fakeSocket";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => jest.restoreAllMocks());

test("shows the sign-in screen when logged out", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
});

test("switches to the register form", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("tab", { name: /register/i }));
  expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
});

test("validates empty credentials", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
  expect(screen.getByRole("alert")).toHaveTextContent(/enter a username and password/i);
});

test("logging in stores the token and opens the chat", async () => {
  const socket = createFakeSocket();
  io.mockReturnValue(socket);
  jest.spyOn(api, "post").mockResolvedValue({ data: { username: "alice", token: "tok123" } });
  jest.spyOn(api, "get").mockResolvedValue({ data: [] });

  render(<App />);
  await userEvent.type(screen.getByLabelText(/username/i), "alice");
  await userEvent.type(screen.getByPlaceholderText(/your password/i), "secret1");
  await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

  expect(await screen.findByRole("heading", { name: /chats/i })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("chatUser"))).toEqual({ username: "alice", token: "tok123" });
  expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: "tok123" } }));

  await userEvent.click(screen.getByRole("button", { name: /log out/i }));
  await waitFor(() => expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument());
  expect(localStorage.getItem("chatUser")).toBeNull();
});
