import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { io } from "socket.io-client";
import { api } from "../api";
import { Chat } from "./Chat";
import { createFakeSocket } from "../test-utils/fakeSocket";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));

const user = { username: "alice", token: "tok123" };
let socket;

beforeEach(() => {
  socket = createFakeSocket();
  io.mockReturnValue(socket);
  jest.spyOn(api, "get").mockImplementation(async (url) => {
    if (url === "/users") {
      return { data: [{ _id: "u2", username: "bob" }, { _id: "u3", username: "carol" }] };
    }
    if (url === "/messages/unread") return { data: { carol: 2 } };
    if (url === "/messages") {
      return {
        data: [{ _id: "m1", sender: "bob", receiver: "alice", message: "hey alice", createdAt: new Date().toISOString() }],
      };
    }
    throw new Error(`unexpected ${url}`);
  });
});

afterEach(() => jest.restoreAllMocks());

test("connects the socket with the JWT and lists users with unread counts", async () => {
  render(<Chat user={user} onLogout={jest.fn()} />);

  expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: "tok123" } }));
  expect(socket.connect).toHaveBeenCalled();
  expect(await screen.findByText("bob")).toBeInTheDocument();
  expect(screen.getByLabelText("2 unread")).toBeInTheDocument();
});

test("opening a chat loads it and sending never includes a sender", async () => {
  render(<Chat user={user} onLogout={jest.fn()} />);
  await userEvent.click(await screen.findByRole("button", { name: /bob/i }));

  expect(await screen.findByText("hey alice")).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/messages", { params: { with: "bob" } });
  expect(socket.emitted).toContainEqual(["mark_as_read", { sender: "bob" }]);

  await userEvent.type(screen.getByLabelText("Message"), "hello bob{Enter}");

  const send = socket.emitted.find(([event]) => event === "send_message");
  expect(send[1]).toEqual({ receiver: "bob", message: "hello bob" });
  expect(screen.getByText("hello bob")).toBeInTheDocument();

  // Server acknowledges -> the optimistic bubble is replaced with the saved message.
  act(() => send[2](null, { _id: "m2", sender: "alice", receiver: "bob", message: "hello bob", status: "sent", createdAt: new Date().toISOString() }));
  expect(screen.getByLabelText("Sent")).toBeInTheDocument();
});

test("messages from other chats bump the unread badge", async () => {
  render(<Chat user={user} onLogout={jest.fn()} />);
  const row = await screen.findByRole("button", { name: /bob/i });

  act(() => socket.serverEmit("receive_message", { _id: "m9", sender: "bob", receiver: "alice", message: "psst" }));

  expect(within(row).getByLabelText("1 unread")).toBeInTheDocument();
  expect(socket.emitted).toContainEqual(["message_delivered", { messageId: "m9" }]);
});

test("an unauthorized socket logs the user out", async () => {
  const onLogout = jest.fn();
  render(<Chat user={user} onLogout={onLogout} />);
  await screen.findByText("bob");

  act(() => socket.serverEmit("connect_error", new Error("unauthorized")));
  expect(onLogout).toHaveBeenCalled();
});
