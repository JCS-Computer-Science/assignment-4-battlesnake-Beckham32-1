import score from "./src/score.js";

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
  let bestMove = "down"; // default fallback
  let bestScore = -Infinity;
  for (const [move, moveScore] of Object.entries(snake.scores)) {
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }

  return { move: bestMove };
}
