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
    const willEat = snake.board.food.some(
      (food) => food.x === new_head.x && food.y === new_head.y,
    );
    const tempBody = [{ ...new_head }, ...snake.body];
    if (!willEat) tempBody.pop();
    const temp_snake = { ...snake, head: new_head, body: tempBody };

    // Floodfill score: count safe squares (2)
    const grid = flood(temp_snake);
    let space_score = 0;
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y] === 2) space_score++;
      }
    }

    // Food score: negative path length to nearest food
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
    for (const part of tempBody) {
      astar_grid[part.x][part.y] = 1;
    }
    if (snake.board.hazards) {
      for (const hazard of snake.board.hazards) {
        astar_grid[hazard.x][hazard.y] = 1;
      }
    }

    const food_path = astar.run(temp_snake, food_targets, astar_grid);
    const food_score = willEat
      ? 1000
      : food_path.length
        ? -food_path.length * 2
        : -2000;

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

    // Combine scores: space is weighted, food and enemy are penalties/rewards
    snake.scores[dir] =
      space_score * 5 + adjusted_food_score + adjusted_enemy_score;
  }

  const move_scores = Object.values(snake.scores);
  return move_scores.sort((a, b) => b - a);
}
