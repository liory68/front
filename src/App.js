import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import GameRoom from './components/GameRoom';
import './App.css';

const PARTYKIT_HOST = process.env.REACT_APP_PARTYKIT_HOST || "backend-party.liory68.partykit.dev";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameId" element={<GameRoom host={PARTYKIT_HOST} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
