import { astar } from "./astar.js";

export default function debug(snake) {
  // Compute debug info
  const width = snake.board.width;
  const height = snake.board.height;
  const grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );

  // Mark blocked cells
  for (const other of snake.board.snakes) {
    for (const part of other.body) {
      grid[part.x][part.y] = 1;
    }
  }
  if (snake.board.hazards) {
    for (const hazard of snake.board.hazards) {
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

  const food_targets = snake.board.food.map((food) => ({
    x: food.x,
    y: food.y,
  }));

  let min_dist = Infinity;
  let target = null;
  for (const food of food_targets) {
    const dist =
      Math.abs(food.x - snake.head.x) + Math.abs(food.y - snake.head.y);
    if (dist < min_dist) {
      min_dist = dist;
      target = food;
    }
  }

  let path = [];
  if (target) {
    path = astar.run(snake, [target], grid);
  }

  const score_grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) continue;
      let min_dist = Infinity;
      for (const food of food_targets) {
        const dist = Math.abs(food.x - x) + Math.abs(food.y - y);
        if (dist < min_dist) min_dist = dist;
      }
      score_grid[x][y] = -min_dist;
    }
  }

  return {
    blocked,
    target,
    scores: score_grid,
    path,
  };
}
