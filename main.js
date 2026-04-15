import score from "./src/score.js";
import { astar } from "./src/astar.js";

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

  // Compute debug info
  const width = gameState.board.width;
  const height = gameState.board.height;
  const grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );

  // Mark blocked cells
  for (const other of gameState.board.snakes) {
    for (const part of other.body) {
      grid[part.x][part.y] = 1;
    }
  }
  if (gameState.board.hazards) {
    for (const hazard of gameState.board.hazards) {
      grid[hazard.x][hazard.y] = 1;
    }
  }

  const blocked = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) {
        blocked.push({ x, y });
      }
    }
  }

  const food_targets = gameState.board.food.map((food) => ({
    x: food.x,
    y: food.y,
  }));

  let minDist = Infinity;
  let target = null;
  for (const food of food_targets) {
    const dist =
      Math.abs(food.x - gameState.you.head.x) +
      Math.abs(food.y - gameState.you.head.y);
    if (dist < minDist) {
      minDist = dist;
      target = food;
    }
  }

  let path = [];
  if (target) {
    path = astar.run(snake, [target], grid);
  }

  const scoreGrid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) continue;
      let minD = Infinity;
      for (const food of food_targets) {
        const d = Math.abs(food.x - x) + Math.abs(food.y - y);
        if (d < minD) minD = d;
      }
      scoreGrid[x][y] = -minD;
    }
  }

  return {
    move: best_move,
    debug: {
      blocked,
      target,
      scores: scoreGrid,
      path,
    },
  };
}
