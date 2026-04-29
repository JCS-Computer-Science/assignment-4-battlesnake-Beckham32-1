import Collision from "./src/collision.js";
import FloodFill from "./src/floodfill.js";
import Astar from "./src/astar.js";
import Score from "./src/score.js";
import Debug from "./src/debug.js";

export default function move(gameState) {
  const game = new Game(gameState);
  return {
    move: game.getMove(),
    debug: game.getDebug(),
  };
}

class Game {
  constructor(gameState) {
    this.state = gameState;
    this.snake = {
      head: gameState.you.head,
      body: gameState.you.body,
      health: gameState.you.health,
      moves: { left: true, right: true, up: true, down: true },
      scores: { left: 0, right: 0, up: 0, down: 0 },
    };
    this.board = gameState.board;
    this.best_move = "up";
    this.debug_info = {};

    // References
    this.collision = new Collision(this);
    this.flood = new FloodFill(this);
    this.astar = new Astar(this);
    this.score = new Score(this);
    this.debug = new Debug(this);
  }
  getMove() {
    this.best_move = this.score.init();
    return this.best_move;
  }
  getDebug() {
    this.debug_info = this.debug.run();
    return this.debug_info;
  }
}
