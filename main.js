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

  // Run scoring to populate snake.scores
  score(snake);

  // Find the move with the highest score
  let best_move = "up"; // default fallback
  let best_score = -Infinity;
  for (const [move, move_score] of Object.entries(snake.scores)) {
    if (move_score > best_score) {
      best_score = move_score;
      best_move = move;
    }
  }

  const { blocked, target, scores: score_grid, path } = debug(snake);

  return {
    move: best_move,
    debug: {
      blocked,
      target,
      scores: score_grid,
      path,
    },
  };
}
