// =====================================
// Simple enemy AI behaviors for testing
// =====================================

// Chaser snake: pursue and try to box the largest snake
// *****************************************************
export function chaser(snake, gameState) {
  // Find the largest snake (target to chase)
  let target = null;
  let max_length = 0;
  for (const other of gameState.board.snakes) {
    if (other.id !== snake.id && other.body.length > max_length) {
      max_length = other.body.length;
      target = other.head;
    }
  }

  return getSmartMove(snake, gameState, target);
}

// Food Finder: Finds and eats the nearest food
// ********************************************
export function foodFinder(snake, gameState) {
  // Find nearest food
  let nearest_food = null;
  let min_dist = Infinity;
  for (const food of gameState.board.food) {
    const dist =
      Math.abs(food.x - snake.head.x) + Math.abs(food.y - snake.head.y);
    if (dist < min_dist) {
      min_dist = dist;
      nearest_food = food;
    }
  }

  return getSmartMove(snake, gameState, nearest_food);
}

// Returns a move based on a target that will not kill the snake (bounds and simple snake collision)
function getSmartMove(snake, gameState, target) {
  const head = snake.head;
  const width = gameState.board.width;
  const height = gameState.board.height;

  // Build set of blocked cells
  const blocked = new Set();
  for (const other of gameState.board.snakes) {
    for (const part of other.body) {
      blocked.add(`${part.x},${part.y}`);
    }
  }
  if (gameState.board.hazards) {
    for (const hazard of gameState.board.hazards) {
      blocked.add(`${hazard.x},${hazard.y}`);
    }
  }

  // Get valid moves
  const moves = [
    { direction: "up", dx: 0, dy: 1 },
    { direction: "down", dx: 0, dy: -1 },
    { direction: "left", dx: -1, dy: 0 },
    { direction: "right", dx: 1, dy: 0 },
  ].filter((move) => {
    const new_x = head.x + move.dx;
    const new_y = head.y + move.dy;
    return (
      // Run collision for bounds and self
      new_x >= 0 &&
      new_x < width &&
      new_y >= 0 &&
      new_y < height &&
      new_x !== head.x - move.dx && // Don't reverse into self
      new_y !== head.y - move.dy &&
      !blocked.has(`${new_x},${new_y}`)
    );
  });

  // If no valid moves, pick any valid direction (shouldn't happen in testing)
  if (moves.length === 0) return "up";

  // If no target, just pick a random valid move
  if (!target) return moves[Math.floor(Math.random() * moves.length)].direction;

  // Pick the move that gets closest to the target
  let best_move = moves[0];
  let best_dist = Infinity;
  for (const move of moves) {
    const newX = head.x + move.dx;
    const newY = head.y + move.dy;
    const dist = Math.abs(newX - target.x) + Math.abs(newY - target.y);
    if (dist < best_dist) {
      best_dist = dist;
      best_move = move;
    }
  }

  return best_move.direction;
}
