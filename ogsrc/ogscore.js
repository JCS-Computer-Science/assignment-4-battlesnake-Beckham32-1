import flood from "./ogfloodfill.js";
import { collision } from "./ogcollision.js";
import { astar } from "./ogastar.js";

// Helper function to check if a move would trap the snake
function wouldTrap(snake, new_head, dir, will_eat) {
  // Create a temporary snake state with the new move
  const temp_body = [{ ...new_head }, ...snake.body];
  if (!will_eat) temp_body.pop();

  const temp_snake = { ...snake, head: new_head, body: temp_body };

  // Check all 4 possible next moves from this position
  const potential_moves = [
    { x: new_head.x, y: new_head.y + 1, dir: "up" },
    { x: new_head.x, y: new_head.y - 1, dir: "down" },
    { x: new_head.x - 1, y: new_head.y, dir: "left" },
    { x: new_head.x + 1, y: new_head.y, dir: "right" },
  ];

  let viable_next_moves = 0;

  for (const next_move of potential_moves) {
    if (collision.isPositionSafe(next_move, temp_snake, !will_eat)) {
      viable_next_moves++;
    }
  }

  // If no viable next moves exist, this move would trap the snake
  return viable_next_moves === 0;
}

export default function score(snake) {
  // Run collision checks to disable invalid moves
  collision.walls(snake);
  collision.self(snake);
  collision.others(snake);

  // Determine game state
  const our_length = snake.body.length;
  const largest_opponent = snake.board.snakes
    .filter((s) => s.id !== snake.game.you.id)
    .reduce((max, s) => (s.body.length > max.body.length ? s : max), {
      body: { length: 0 },
    });
  const is_largest = our_length > largest_opponent.body.length;

  // Check for stalemate scenario: exactly 2 snakes alive and similar size
  const alive_snakes = snake.board.snakes.length;
  const size_difference = Math.abs(our_length - largest_opponent.body.length);
  const is_stalemate = alive_snakes === 2 && size_difference <= 3;

  // Determine game phase
  let phase = "growth"; // Default: growth mode
  if (is_largest && alive_snakes > 1) {
    phase = "attack"; // Phase 2: We're largest, hunt smaller snakes
  }
  if (snake.health < 40 && phase === "attack") {
    phase = "emergency_feed"; // Phase 3: Starving while attacking
  }

  const directions = ["up", "down", "left", "right"];
  for (const dir of directions) {
    if (!snake.moves[dir]) {
      snake.scores[dir] = -Infinity;
      continue;
    }

    // Simulate new head position
    const new_head = { ...snake.head };
    if (dir === "up") new_head.y += 1;
    else if (dir === "down") new_head.y -= 1;
    else if (dir === "left") new_head.x -= 1;
    else if (dir === "right") new_head.x += 1;

    // Check if this move would eat food
    const will_eat = snake.board.food.some(
      (food) => food.x === new_head.x && food.y === new_head.y,
    );
    const temp_body = [{ ...new_head }, ...snake.body];
    if (!will_eat) temp_body.pop();

    // Collision validation
    if (!collision.isPositionSafe(new_head, snake, !will_eat)) {
      snake.scores[dir] = -Infinity;
      continue;
    }

    if (wouldTrap(snake, new_head, dir, will_eat)) {
      snake.scores[dir] = -Infinity;
      continue;
    }

    const temp_snake = { ...snake, head: new_head, body: temp_body };

    // Calculate space safety
    const grid = flood(temp_snake);
    let space_score = 0;
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y] === 2) space_score++;
      }
    }

    const total_cells = snake.board.width * snake.board.height;
    let occupied_cells = 0;
    for (const other of snake.board.snakes) {
      occupied_cells += other.body.length;
    }
    if (snake.board.hazards) {
      occupied_cells += snake.board.hazards.length;
    }
    const free_cells = total_cells - occupied_cells;

    // Enforce minimum space threshold (stricter for growth phase)
    const space_threshold = phase === "growth" ? 0.6 : 0.5;
    if (space_score < free_cells * space_threshold) {
      snake.scores[dir] = -Infinity;
      continue;
    }

    // Build A* grid
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

    // Phase-based scoring
    const food_targets = snake.board.food.map((f) => ({ x: f.x, y: f.y }));
    if (phase === "growth") {
      scoreGrowthPhase(
        snake,
        new_head,
        will_eat,
        temp_snake,
        dir,
        astar_grid,
        food_targets,
        space_score,
      );
    } else if (phase === "attack") {
      scoreAttackPhase(
        snake,
        new_head,
        will_eat,
        temp_snake,
        dir,
        astar_grid,
        space_score,
        is_stalemate,
      );
    } else if (phase === "emergency_feed") {
      scoreEmergencyFeedPhase(
        snake,
        new_head,
        will_eat,
        temp_snake,
        dir,
        astar_grid,
        space_score,
      );
    }
  }

  // Find best move
  let best_move = null;
  let best_score = -Infinity;
  for (const [move, move_score] of Object.entries(snake.scores)) {
    if (move_score > best_score) {
      best_score = move_score;
      best_move = move;
    }
  }

  // Ensure the selected move is actually valid
  if (!best_move || !snake.moves[best_move] || best_score === -Infinity) {
    let fallback_move = null;
    let fallback_score = -Infinity;
    for (const [move, valid] of Object.entries(snake.moves)) {
      if (valid && snake.scores[move] > fallback_score) {
        fallback_score = snake.scores[move];
        fallback_move = move;
      }
    }
    if (fallback_move) {
      best_move = fallback_move;
    }
  }

  if (Object.values(snake.moves).filter((v) => v).length === 1) {
    best_move = Object.keys(snake.moves).find((k) => snake.moves[k]);
  }

  if (!best_move || !snake.moves[best_move]) {
    for (const [move, valid] of Object.entries(snake.moves)) {
      if (valid) {
        return move;
      }
    }
    return "up";
  }

  return best_move;
}

// Phase 1: Growth - Aggressively hunt food
function scoreGrowthPhase(
  snake,
  new_head,
  will_eat,
  temp_snake,
  dir,
  astar_grid,
  food_targets,
  space_score,
) {
  const food_path =
    astar.run(temp_snake, food_targets, astar_grid, {
      safe_threshold: 0.6,
      long_mode: false,
      survival: false,
    }) || [];

  const is_on_food_path =
    food_path.length > 0 &&
    food_path[0].x === new_head.x &&
    food_path[0].y === new_head.y;

  let food_score = 0;
  if (will_eat) {
    food_score = 2000; // Massive bonus for eating
  } else if (food_path.length) {
    food_score = -food_path.length * 5; // Heavily penalize long paths
    if (is_on_food_path) {
      food_score += 500;
    }
  } else {
    food_score = -1000; // Heavy penalty if no path to food
  }

  snake.scores[dir] = food_score + space_score * 2;
}

// Phase 2: Attack - Move to center and hunt smaller snakes
function scoreAttackPhase(
  snake,
  new_head,
  will_eat,
  temp_snake,
  dir,
  astar_grid,
  space_score,
  is_stalemate,
) {
  const board_center = {
    x: snake.board.width / 2,
    y: snake.board.height / 2,
  };

  // Distance to center
  const dist_to_center =
    Math.abs(new_head.x - board_center.x) +
    Math.abs(new_head.y - board_center.y);
  const center_score = -dist_to_center * 2; // Negative so closer is better

  // Hunt smaller snakes
  let hunt_score = 0;
  for (const other of snake.board.snakes) {
    if (
      other.id === snake.game.you.id ||
      other.body.length >= snake.body.length
    )
      continue;

    const dist_to_enemy =
      Math.abs(new_head.x - other.head.x) + Math.abs(new_head.y - other.head.y);
    hunt_score += (20 - Math.min(dist_to_enemy, 20)) * 10; // Reward being close to smaller snakes
  }

  // Only use long_mode in stalemate scenarios
  const food_targets = snake.board.food.map((f) => ({ x: f.x, y: f.y }));
  const food_path =
    astar.run(temp_snake, food_targets, astar_grid, {
      safe_threshold: 0.5,
      long_mode: is_stalemate, // Only use long_mode if we're in a stalemate
      survival: false,
    }) || [];

  let food_score = 0;
  if (will_eat) {
    food_score = 500; // Moderate bonus for eating (lower priority than hunting)
  } else if (food_path.length) {
    food_score = food_path.length * 0.5; // Slightly penalize getting too far from food
  }

  snake.scores[dir] = center_score + hunt_score + food_score + space_score * 1;
}

// Phase 3: Emergency Feed - Health critical while attacking
function scoreEmergencyFeedPhase(
  snake,
  new_head,
  will_eat,
  temp_snake,
  dir,
  astar_grid,
  space_score,
) {
  const food_targets = snake.board.food.map((f) => ({ x: f.x, y: f.y }));
  const food_path =
    astar.run(temp_snake, food_targets, astar_grid, {
      safe_threshold: 0.5,
      long_mode: false,
      survival: false,
    }) || [];

  const is_on_food_path =
    food_path.length > 0 &&
    food_path[0].x === new_head.x &&
    food_path[0].y === new_head.y;

  let food_score = 0;
  if (will_eat) {
    food_score = 3000; // Highest priority - must eat
  } else if (food_path.length) {
    food_score = -food_path.length * 6; // Heavily penalize long paths
    if (is_on_food_path) {
      food_score += 500;
    }
  } else {
    food_score = -2000; // Critical if no food path
  }

  snake.scores[dir] = food_score + space_score * 1;
}
