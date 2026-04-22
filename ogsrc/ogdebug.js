import flood from "./ogfloodfill.js";
import { astar } from "./ogastar.js";

export default function debug(snake) {
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
  // Guard in case gamemode has no hazards
  if (snake.board.hazards) {
    for (const hazard of snake.board.hazards) {
      grid[hazard.x][hazard.y] = 1;
    }
  }

  // Any cells the snake has no access to (will kill it)
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

  // Copied from score.js and modified for the debug testing
  // ? move to new file to extend from each script
  const score_grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) continue;

      const test_head = { x, y };
      const test_body = [test_head, ...snake.body];
      if (test_body.length > 1) test_body.pop();
      const test_snake = { ...snake, head: test_head, body: test_body };

      const test_grid = flood(test_snake);
      let test_space_score = 0;
      for (let tx = 0; tx < test_grid.length; tx++) {
        for (let ty = 0; ty < test_grid[0].length; ty++) {
          if (test_grid[tx][ty] === 2) test_space_score++;
        }
      }

      const will_eat = food_targets.some(
        (food) => food.x === x && food.y === y,
      );
      const test_temp_body = [{ x, y }, ...snake.body];
      if (!will_eat) test_temp_body.pop();

      const test_astar_grid = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => 0),
      );
      for (const other of snake.board.snakes) {
        if (other.id === snake.game.you.id) continue;
        for (const part of other.body) {
          test_astar_grid[part.x][part.y] = 1;
        }
      }
      for (const part of test_temp_body) {
        test_astar_grid[part.x][part.y] = 1;
      }
      if (snake.board.hazards) {
        for (const hazard of snake.board.hazards) {
          test_astar_grid[hazard.x][hazard.y] = 1;
        }
      }

      const test_food_path =
        astar.run(test_snake, food_targets, test_astar_grid, {
          safe_threshold: 0.8,
          long_mode: astar.isLongMode(snake),
          survival: true,
        }) || [];

      let test_food_score = 0;
      if (will_eat) {
        test_food_score = 1000;
      } else if (test_food_path && test_food_path.length) {
        test_food_score = -test_food_path.length * 2;
      }

      const dist_to_left = x;
      const dist_to_right = width - 1 - x;
      const dist_to_bottom = y;
      const dist_to_top = height - 1 - y;
      const min_dist_to_edge = Math.min(
        dist_to_left,
        dist_to_right,
        dist_to_bottom,
        dist_to_top,
      );
      const edge_penalty = Math.max(0, 700 - min_dist_to_edge * 140);

      score_grid[x][y] = test_space_score * 5 + test_food_score - edge_penalty;
    }
  }

  const safe_food_path = astar.run(snake, food_targets, grid, {
    safe_threshold: 0.8,
    survival: false,
  });
  const effective_path = astar.run(snake, food_targets, grid, {
    safe_threshold: 0.8,
    survival: true,
  });
  const path_type = safe_food_path.length ? "safe-food" : "survival";
  if (path_type === "survival" && effective_path.length) {
    target = effective_path[effective_path.length - 1];
  }

  let reachable_cells = 0;
  let safe_ratio = 0;
  if (effective_path.length) {
    const end = effective_path[effective_path.length - 1];
    const will_eat = food_targets.some(
      (food) => food.x === end.x && food.y === end.y,
    );
    const projected = astar.simulateProjectedGrid(
      snake,
      effective_path,
      grid,
      will_eat,
    );
    if (astar.inBounds(projected, end.x, end.y)) {
      projected[end.x][end.y] = 0;
    }
    reachable_cells = astar.countReachableCells(projected, end.x, end.y);
    safe_ratio = width * height > 0 ? reachable_cells / (width * height) : 0;
  }

  return {
    blocked,
    target,
    scores: score_grid,
    path: effective_path,
    path_type,
    long_mode: astar.isLongMode(snake),
    reachable_cells,
    total_cells: width * height,
    safe_ratio,
  };
}
