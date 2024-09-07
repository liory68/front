import { Party } from "partykit/server";

export default class GameParty extends Party {
  constructor(party) {
    super(party);
    this.games = new Map();
  }

  onConnect(conn, ctx) {
    console.log("New connection", conn.id);
  }

  onMessage(message, sender) {
    const { type, payload } = JSON.parse(message);
    
    switch (type) {
      case 'createGame':
        this.createGame(payload, sender);
        break;
      case 'joinGame':
        this.joinGame(payload, sender);
        break;
      case 'submitAnswer':
        this.submitAnswer(payload, sender);
        break;
      // Add other game logic here
    }
  }

  createGame(payload, sender) {
    const { playerName, color } = payload;
    const gameId = Math.random().toString(36).substring(7);
    this.games.set(gameId, {
      players: [{ id: sender.id, name: playerName, color, score: 0 }],
      currentQuestion: this.getRandomQuestion(),
      questionCount: 0
    });
    sender.send(JSON.stringify({ type: 'gameCreated', gameId, player: this.games.get(gameId).players[0] }));
  }

  joinGame(payload, sender) {
    const { gameId, playerName, color } = payload;
    const game = this.games.get(gameId);
    if (!game) {
      sender.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
      return;
    }
    const player = { id: sender.id, name: playerName, color, score: 0 };
    game.players.push(player);
    this.games.set(gameId, game);
    this.party.broadcast(JSON.stringify({ type: 'playerJoined', gameId, players: game.players }));
    sender.send(JSON.stringify({ type: 'gameJoined', player, currentQuestion: game.currentQuestion }));
  }

  submitAnswer(payload, sender) {
    const { gameId, answer } = payload;
    const game = this.games.get(gameId);
    if (!game) {
      sender.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
      return;
    }
    const player = game.players.find(p => p.id === sender.id);
    if (!player) {
      sender.send(JSON.stringify({ type: 'error', message: 'Player not found' }));
      return;
    }
    if (answer === game.currentQuestion.answer) {
      player.score += 1;
      game.questionCount += 1;
      if (game.questionCount >= 10) {
        this.endGame(gameId);
      } else {
        game.currentQuestion = this.getRandomQuestion();
        this.party.broadcast(JSON.stringify({ type: 'newQuestion', gameId, question: game.currentQuestion }));
      }
    }
    this.party.broadcast(JSON.stringify({ type: 'playerUpdated', gameId, players: game.players }));
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    const sortedPlayers = game.players.sort((a, b) => b.score - a.score);
    this.party.broadcast(JSON.stringify({ type: 'gameEnded', gameId, leaderboard: sortedPlayers }));
    this.games.delete(gameId);
  }

  getRandomQuestion() {
    // Implement your question generation logic here
    return { question: "What is 2 + 2?", answer: 4 };
  }
}