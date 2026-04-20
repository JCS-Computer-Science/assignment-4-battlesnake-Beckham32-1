import flood from "./floodfill.js";
import { collision } from "./collision.js";
import { astar } from "./astar.js";

export default function score(snake) {
  // Run collision checks to disable invalid moves
  collision.walls(snake);
  collision.self(snake);
  collision.others(snake);

  const directions = ["up", "down", "left", "right"];
  for (const dir of directions) {
    if (!snake.moves[dir]) {
      snake.scores[dir] = -Infinity; // Invalid moves get -Infinity score so they are never chosen
      continue;
    }

    // Simulate new head position
    const new_head = { ...snake.head };
    if (dir === "up") new_head.y += 1;
    else if (dir === "down") new_head.y -= 1;
    else if (dir === "left") new_head.x -= 1;
    else if (dir === "right") new_head.x += 1;

    // Determine whether this move would eat food and simulate the body movement
    const will_eat = snake.board.food.some(
      (food) => food.x === new_head.x && food.y === new_head.y,
    );
    const temp_body = [{ ...new_head }, ...snake.body];
    if (!will_eat) temp_body.pop();

    // Block out moves into hazards or snake parts
    const blocked = new Set();
    for (const other of snake.board.snakes) {
      for (const [index, part] of other.body.entries()) {
        const is_own_tail =
          other.id === snake.game.you.id &&
          index === other.body.length - 1 &&
          !will_eat;
        if (!is_own_tail) {
          blocked.add(`${part.x},${part.y}`);
        }
      }
    }
    if (snake.board.hazards) {
      for (const hazard of snake.board.hazards) {
        blocked.add(`${hazard.x},${hazard.y}`);
      }
    }

    if (
      collision.general(snake, new_head) ||
      blocked.has(`${new_head.x},${new_head.y}`)
    ) {
      snake.scores[dir] = -Infinity; // Direction will collide with bounds or blocked cell
      continue;
    }

    const temp_snake = { ...snake, head: new_head, body: temp_body };

    // Floodfill score: count safe squares (2)
    const grid = flood(temp_snake);
    let space_score = 0;
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y] === 2) space_score++;
      }
    }

    const total_cells = snake.board.width * snake.board.height;

    // Calculate how many cells are actually free (not occupied by snakes/hazards)
    let occupied_cells = 0;
    for (const other of snake.board.snakes) {
      occupied_cells += other.body.length;
    }
    if (snake.board.hazards) {
      occupied_cells += snake.board.hazards.length;
    }
    const free_cells = total_cells - occupied_cells;

    const starving = snake.health < 50; // Starving Mode: if snake health drops below the threshold (50) it will ignore most other rules and go straight for food
    const safe_threshold = starving ? 0.2 : 0.8; // Threshold for how much of the board the snake must be able to access at all times (80%), when starving (20%)

    if (space_score < free_cells * safe_threshold) {
      snake.scores[dir] = -Infinity; // Direction score is killed as it fails the 80% guard
      continue;
    }

    // Food score: prefer safe paths, but when starving go for the closest food.
    const food_targets = snake.board.food.map((food) => ({
      x: food.x,
      y: food.y,
    }));
    const astar_grid = Array.from({ length: snake.board.width }, () =>
      Array.from({ length: snake.board.height }, () => 0),
    );
    for (const other of snake.board.snakes) {
      if (other.id === snake.game.you.id) continue;
      for (const part of other.body) {
        astar_grid[part.x][part.y] = 1;
      }
    }
    for (const part of temp_body) {
      astar_grid[part.x][part.y] = 1;
    }
    if (snake.board.hazards) {
      for (const hazard of snake.board.hazards) {
        astar_grid[hazard.x][hazard.y] = 1;
      }
    }

    const long_mode = !starving && astar.isLongMode(snake); // Long mode: if snake exceeds 25 segments it is considered long and now takes the longest instead of the shortest astar path
    const food_path = astar.run(temp_snake, food_targets, astar_grid, {
      safe_threshold,
      long_mode,
      survival: false,
    });

    // Check if this move is on the food path
    const is_on_food_path =
      food_path.length > 0 &&
      food_path[0].x === new_head.x &&
      food_path[0].y === new_head.y;

    let food_score;
    if (will_eat) {
      food_score = 1000; // Strong bonus for eating food
    } else if (food_path.length) {
      if (starving) {
        food_score = -food_path.length * 4; // When starving, heavily penalize longer paths to food
      } else {
        food_score = long_mode ? -food_path.length * 2 : food_path.length * 2; // Normal mode: prefer shorter paths, Long mode: prefer longer paths to extend survival time
      }
      if (is_on_food_path) {
        food_score += 300; // Strong bonus for being on the direct path to food
      }
    } else {
      food_score = starving ? -2000 : 0; // If starving and no path to food, heavy penalty. Otherwise, no food score if no path exists
    }

    // Enemy score: based on attack logic
    let enemy_score = 0;
    let closest_snake = null;
    let min_dist = Infinity;

    for (const other of snake.board.snakes) {
      if (other.id === snake.game.you.id) continue;
      const dist =
        Math.abs(other.head.x - temp_snake.head.x) +
        Math.abs(other.head.y - temp_snake.head.y);
      if (dist < min_dist) {
        min_dist = dist;
        closest_snake = other;
      }
    }

    if (closest_snake) {
      if (closest_snake.body.length > snake.body.length) {
        // Prioritize food, enemy score remains 0
      } else {
        // Predict enemy position and score path
        let predicted_x = closest_snake.head.x;
        let predicted_y = closest_snake.head.y;
        const closest_food = snake.board.food.reduce((closest, food) => {
          const dist =
            Math.abs(food.x - closest_snake.head.x) +
            Math.abs(food.y - closest_snake.head.y);
          const closest_dist = closest
            ? Math.abs(closest.x - closest_snake.head.x) +
              Math.abs(closest.y - closest_snake.head.y)
            : Infinity;
          return dist < closest_dist ? food : closest;
        }, null);
        if (closest_food) {
          if (closest_food.x > closest_snake.head.x) predicted_x += 1;
          else if (closest_food.x < closest_snake.head.x) predicted_x -= 1;
          else if (closest_food.y > closest_snake.head.y) predicted_y += 1;
          else if (closest_food.y < closest_snake.head.y) predicted_y -= 1;
        }
        predicted_x = Math.max(0, Math.min(predicted_x, snake.board.width - 1));
        predicted_y = Math.max(
          0,
          Math.min(predicted_y, snake.board.height - 1),
        );
        const enemy_path = astar.run(
          temp_snake,
          [{ x: predicted_x, y: predicted_y }],
          astar_grid,
        );
        enemy_score = enemy_path.length ? -enemy_path.length * 2 : -2000;
      }
    }

    const hunger = (100 - snake.health) / 100.0;
    const adjusted_food_score = food_score * (1 + hunger * 2);
    const adjusted_enemy_score = enemy_score * (1 + hunger);

    // Edge penalty: discourage positions near board boundaries
    const dist_to_left = new_head.x;
    const dist_to_right = snake.board.width - 1 - new_head.x;
    const dist_to_bottom = new_head.y;
    const dist_to_top = snake.board.height - 1 - new_head.y;
    const min_dist_to_edge = Math.min(
      dist_to_left,
      dist_to_right,
      dist_to_bottom,
      dist_to_top,
    );
    const edge_penalty = Math.max(0, 700 - min_dist_to_edge * 140);

    // When starving, ONLY prioritize food - ignore space and enemy concerns
    if (starving) {
      snake.scores[dir] = adjusted_food_score;
      if (is_on_food_path) {
        snake.scores[dir] += 500; // Extra bonus for being on the direct path when starving
      }
    } else {
      // Normal scoring: balance space, food, and enemy
      snake.scores[dir] =
        space_score * 5 +
        adjusted_food_score +
        adjusted_enemy_score -
        edge_penalty;
    }
  }

  // Find the move with the highest score, or least-worst if all are negative
  let best_move = null;
  let best_score = -Infinity;
  for (const [move, move_score] of Object.entries(snake.scores)) {
    if (move_score > best_score) {
      best_score = move_score;
      best_move = move;
    }
  }

  // Ensure the selected move is actually valid - never return an invalid move
  if (!best_move || !snake.moves[best_move]) {
    // Find the first valid move
    for (const [move, valid] of Object.entries(snake.moves)) {
      if (valid) {
        best_move = move;
        break;
      }
    }
  }

  // If all but 1 move is false, that is the only move
  if (Object.values(snake.moves).filter((v) => v).length === 1) {
    best_move = snake.moves[best_move] ? best_move : null;
  }

  return !best_move ? "up" : best_move; // Last resort: if somehow no valid moves existed return up
}
