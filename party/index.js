import { Party } from "partykit/server";

export default class GameParty extends Party {
  constructor(party) {
    super(party);
    this.games = new Map();
    this.questions = [];
  }

  async onStart() {
    await this.fetchQuestions();
  }

  async fetchQuestions() {
    try {
      const response = await fetch('https://back-ten-lilac.vercel.app/questions/random');
      const question = await response.json();
      this.questions = [question];
      console.log("Fetched question:", question);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  }

  onConnect(conn, ctx) {
    console.log("New connection", conn.id);
    conn.send(JSON.stringify({ 
      type: 'serverMessage', 
      message: 'Hello from server' 
    }));
  }

  onMessage(message, sender) {
    console.log("Received message:", message);
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'joinGame':
          this.joinGame(data.payload, sender);
          break;
        case 'submitAnswer':
          this.submitAnswer(data.payload, sender);
          break;
        default:
          console.log("Unhandled message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sender.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  joinGame(payload, sender) {
    console.log("Joining game with payload:", payload);
    const { gameId, name, color } = payload;
    let game = this.games.get(gameId);
    if (!game) {
      console.log("Creating new game for gameId:", gameId);
      game = { players: [], currentQuestion: this.getRandomQuestion(), questionCount: 0 };
      this.games.set(gameId, game);
    }
    const player = { id: sender.id, name, color, score: 0 };
    game.players.push(player);
    console.log("Sending gameJoined message to player");
    sender.send(JSON.stringify({ type: 'gameJoined', player, currentQuestion: game.currentQuestion }));
    console.log("Broadcasting playerList");
    this.party.broadcast(JSON.stringify({ type: 'playerList', players: game.players }), [sender.id]);
  }

  submitAnswer(payload, sender) {
    const { gameId, answer } = payload;
    const game = this.games.get(gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === sender.id);
    if (!player) return;
    
    if (answer === game.currentQuestion.answer) {
      player.score += 1;
      game.questionCount += 1;
      if (game.questionCount >= 10) {
        this.endGame(gameId);
      } else {
        game.currentQuestion = this.getRandomQuestion();
        this.party.broadcast(JSON.stringify({ type: 'newQuestion', question: game.currentQuestion }));
      }
    }
    this.party.broadcast(JSON.stringify({ type: 'playerList', players: game.players }));
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    const sortedPlayers = game.players.sort((a, b) => b.score - a.score);
    this.party.broadcast(JSON.stringify({ type: 'gameEnded', leaderboard: sortedPlayers }));
    this.games.delete(gameId);
  }

  getRandomQuestion() {
    console.log("Getting random question, questions array length:", this.questions.length);
    if (this.questions.length === 0) {
      console.log("No questions available, returning placeholder");
      return { question: "Loading questions...", answer: 0 };
    }
    return this.questions[0];
  }
}