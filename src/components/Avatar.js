import React from "react";

// Stable hue per username so each person keeps the same color everywhere.
const hueFor = (name = "") =>
  [...name].reduce((hash, ch) => (hash * 31 + ch.charCodeAt(0)) % 360, 7);

const initialsFor = (name = "") =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const Avatar = ({ name, size = "md", online = false }) => (
  <span
    className={`avatar avatar-${size}`}
    style={{ "--avatar-hue": hueFor(name) }}
    aria-hidden="true"
  >
    {initialsFor(name)}
    {online && <span className="presence-dot" />}
  </span>
);

export default Avatar;
