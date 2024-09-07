import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { createPartySocket } from "partykit/client";
import Home from './components/Home';
import GameRoom from './components/GameRoom';
import './App.css';

const PARTYKIT_HOST = process.env.REACT_APP_PARTYKIT_HOST || "localhost:1999";

const socket = createPartySocket({
  host: PARTYKIT_HOST,
  room: "game",
});

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameId" element={<GameRoom socket={socket} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
