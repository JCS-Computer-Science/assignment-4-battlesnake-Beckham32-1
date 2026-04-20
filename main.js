import score from "./src/score.js";
import debug from "./src/debug.js";

export default function move(gameState) {
  const snake = {
    game: gameState,
    head: gameState.you.head,
    body: gameState.you.body,
    health: gameState.you.health,
    board: gameState.board,
    moves: { left: true, right: true, up: true, down: true },
    scores: { left: 0, right: 0, up: 0, down: 0 },
  };
  
  const best_move = score(snake);
  const debug_info = debug(snake);

  return {
    move: best_move,
    debug: debug_info,
  };
}
