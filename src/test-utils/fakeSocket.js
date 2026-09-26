// Minimal stand-in for a socket.io client socket, driven manually by tests.
export const createFakeSocket = () => {
  const listeners = {};
  const socket = {
    emitted: [],
    on: jest.fn((event, fn) => {
      (listeners[event] ||= []).push(fn);
      return socket;
    }),
    off: jest.fn((event, fn) => {
      listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
      return socket;
    }),
    emit: jest.fn((event, ...args) => {
      socket.emitted.push([event, ...args]);
      return socket;
    }),
    timeout: jest.fn(() => socket),
    connect: jest.fn(),
    disconnect: jest.fn(),
    // Simulate an event arriving from the server.
    serverEmit: (event, ...args) => (listeners[event] || []).forEach((fn) => fn(...args)),
  };
  return socket;
};
