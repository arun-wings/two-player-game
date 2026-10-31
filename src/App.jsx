import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage.jsx";
import GamePage from "./components/GamePage.jsx";
import { useArenaGame } from "./hooks/useArenaGame.js";

function GameRoutes() {
  const game = useArenaGame();

  return (
    <Routes>
      <Route path="/" element={<HomePage {...game} />} />
      <Route path="/game/:roomCode" element={<GamePage {...game} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GameRoutes />
    </BrowserRouter>
  );
}

export default App;
