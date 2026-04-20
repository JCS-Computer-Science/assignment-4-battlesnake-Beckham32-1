/**
 * Simple enemy AI behaviors for testing
 =====================================
 */

/**
 * Chaser: Pursues the largest snake on the board
 */
export function chaser(snake, gameState) {
  // Find the largest snake (target to chase)
  let target = null;
  let maxLength = 0;
  for (const other of gameState.board.snakes) {
    if (other.id !== snake.id && other.body.length > maxLength) {
      maxLength = other.body.length;
      target = other.head;
    }
  }

  return getSmartMove(snake, gameState, target);
}

/**
 * FoodFinder: Moves towards the nearest food
 */
export function foodFinder(snake, gameState) {
  // Find nearest food
  let nearestFood = null;
  let minDist = Infinity;
  for (const food of gameState.board.food) {
    const dist =
      Math.abs(food.x - snake.head.x) + Math.abs(food.y - snake.head.y);
    if (dist < minDist) {
      minDist = dist;
      nearestFood = food;
    }
  }

  return getSmartMove(snake, gameState, nearestFood);
}

/**
 * Get a smart move towards a target, avoiding obstacles
 */
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
    const newX = head.x + move.dx;
    const newY = head.y + move.dy;
    return (
      newX >= 0 &&
      newX < width &&
      newY >= 0 &&
      newY < height &&
      !blocked.has(`${newX},${newY}`)
    );
  });

  // If no valid moves, pick any valid direction (shouldn't happen in test)
  if (moves.length === 0) {
    return "up";
  }

  // If no target, just pick a random valid move
  if (!target) {
    return moves[Math.floor(Math.random() * moves.length)].direction;
  }

  // Pick the move that gets closest to the target
  let bestMove = moves[0];
  let bestDist = Infinity;
  for (const move of moves) {
    const newX = head.x + move.dx;
    const newY = head.y + move.dy;
    const dist = Math.abs(newX - target.x) + Math.abs(newY - target.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestMove = move;
    }
  }

  return bestMove.direction;
}
