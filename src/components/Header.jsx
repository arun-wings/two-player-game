import React from "react";

function Header({ statusText }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">MVP · PHASE 1</p>
        <h1>Two Player Arena</h1>
      </div>
      <span className="status"><span className="status-dot" />{statusText}</span>
    </header>
  );
}

export default Header;
