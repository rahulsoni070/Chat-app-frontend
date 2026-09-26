import { render, screen } from "@testing-library/react";
import MessageList from "./MessageList";

const user = { username: "alice" };
const now = new Date().toISOString();

test("renders bubbles with the right side and receipt ticks", () => {
  render(
    <MessageList
      user={user}
      messages={[
        { _id: "1", sender: "bob", receiver: "alice", message: "hi", createdAt: now },
        { _id: "2", sender: "alice", receiver: "bob", message: "sent one", status: "sent", createdAt: now },
        { _id: "3", sender: "alice", receiver: "bob", message: "read one", status: "read", createdAt: now },
        { tempId: "t", sender: "alice", receiver: "bob", message: "oops", status: "failed", createdAt: now },
      ]}
    />
  );

  expect(screen.getByText("hi").closest(".message")).toHaveClass("received");
  expect(screen.getByText("sent one").closest(".message")).toHaveClass("sent");
  expect(screen.getByLabelText("Sent")).toBeInTheDocument();
  expect(screen.getByLabelText("Read")).toHaveClass("tick-read");
  expect(screen.getByText("oops").closest(".message")).toHaveClass("failed");
  expect(screen.getByText("Today")).toBeInTheDocument();
});

test("shows an empty state and typing indicator", () => {
  render(<MessageList user={user} messages={[]} typingUser="bob" />);
  expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  expect(screen.getByLabelText("bob is typing")).toBeInTheDocument();
});
