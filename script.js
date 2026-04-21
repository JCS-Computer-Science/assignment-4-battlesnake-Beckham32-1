import { chaser, foodFinder } from "./src/enemies.js";

const sample_state = {
  game: { id: "sample-game-123" },
  turn: 1,
  board: {
    height: 11,
    width: 11,
    food: [],
    snakes: [
      {
        id: "you",
        name: "PreV2",
        health: 100,
        body: [
          { x: 5, y: 5 },
          { x: 5, y: 4 },
          { x: 5, y: 3 },
        ],
        head: { x: 5, y: 5 },
        length: 3,
        shout: "Debug mode enabled",
      },
      {
        id: "enemy-1",
        name: "Foodmuncher",
        type: "foodFinder",
        health: 100,
        body: [
          { x: 8, y: 8 },
          { x: 8, y: 7 },
          { x: 7, y: 7 },
          { x: 7, y: 8 },
        ],
        head: { x: 8, y: 8 },
        length: 4,
        shout: "I love food!",
      },
      {
        id: "enemy-2",
        name: "Followsnake",
        type: "chaser",
        health: 100,
        body: [
          { x: 2, y: 2 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ],
        head: { x: 2, y: 2 },
        length: 4,
        shout: "I'm following you!",
      },
    ],
  },
  you: {
    id: "you",
    name: "PreV2",
    health: 100,
    body: [
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 3 },
    ],
    head: { x: 5, y: 5 },
    length: 3,
    shout: "Debug mode enabled",
  },
};

const board_element = document.getElementById("board");
const summary_panel = document.getElementById("summaryPanel");
const move_response = document.getElementById("moveResponse");
const move_analysis = document.getElementById("moveAnalysis");

let show_debug = false;
let debug_data = null;

const getCellKey = (x, y) => `${x},${y}`;

function getSafeMoves(state) {
  const head = state.you.head;
  const width = state.board.width;
  const height = state.board.height;
  const blocked = new Set();

  state.board.snakes.forEach((snake) => {
    snake.body.forEach((segment) =>
      blocked.add(getCellKey(segment.x, segment.y)),
    );
  });
  if (state.board.hazards) {
    state.board.hazards.forEach((hazard) =>
      blocked.add(getCellKey(hazard.x, hazard.y)),
    );
  }

  return {
    up: head.y + 1 < height && !blocked.has(getCellKey(head.x, head.y + 1)),
    down: head.y - 1 >= 0 && !blocked.has(getCellKey(head.x, head.y - 1)),
    left: head.x - 1 >= 0 && !blocked.has(getCellKey(head.x - 1, head.y)),
    right: head.x + 1 < width && !blocked.has(getCellKey(head.x + 1, head.y)),
  };
}

function renderBoard() {
  const { board, you } = sample_state;
  const width = board.width;
  const height = board.height;

  board_element.style.setProperty(
    "grid-template-columns",
    `repeat(${width}, 38px)`,
  );
  board_element.innerHTML = "";

  // Randomize snakes if not done
  if (!sample_state.randomized) {
    board.snakes.forEach((snake) => {
      let head_x, head_y;
      do {
        head_x = Math.floor(Math.random() * width);
        head_y = Math.floor(Math.random() * height);
      } while (head_x < 0 || head_x >= width || head_y < 0 || head_y >= height);
      snake.head = { x: head_x, y: head_y };
      snake.body = [
        { x: head_x, y: head_y },
        { x: head_x, y: head_y - 1 },
        { x: head_x, y: head_y - 2 },
      ];
      snake.length = snake.body.length;
    });
    sample_state.you = board.snakes[0];
    sample_state.randomized = true;
  }

  // Generate food if not present
  if (board.food.length === 0) {
    for (let i = 0; i < 3; i++) {
      let food_x, food_y;
      let occupied;
      do {
        food_x = Math.floor(Math.random() * width);
        food_y = Math.floor(Math.random() * height);
        occupied = board.snakes.some((snake) =>
          snake.body.some((part) => part.x === food_x && part.y === food_y),
        );
      } while (occupied);
      board.food.push({ x: food_x, y: food_y });
    }
  }

  const cell_map = new Map();
  board.food.forEach((food) =>
    cell_map.set(getCellKey(food.x, food.y), "food"),
  );
  if (board.hazards) {
    board.hazards.forEach((hazard) =>
      cell_map.set(getCellKey(hazard.x, hazard.y), "hazard"),
    );
  }
  board.snakes.forEach((snake) => {
    snake.body.forEach((segment, index) => {
      const key = getCellKey(segment.x, segment.y);
      const type =
        snake.id === sample_state.you.id
          ? index === 0
            ? "you-head"
            : "you-body"
          : index === 0
            ? "enemy-head"
            : "enemy-body";
      cell_map.set(key, type);
    });
  });

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const key = getCellKey(x, y);
      const type = cell_map.get(key) || "empty";
      const cell = document.createElement("div");
      cell.className = `cell ${type}`;
      cell.textContent =
        type === "food"
          ? "Food"
          : type === "hazard"
            ? "Death"
            : type === "you-head"
              ? "PreV2"
              : type === "enemy-head"
                ? "Enemy"
                : type === "you-body" || type === "enemy-body"
                  ? "•"
                  : "";
      board_element.appendChild(cell);
    }
  }

  const safe_moves = getSafeMoves(sample_state);
  const safe_strings = Object.entries(safe_moves)
    .map(
      ([direction, allowed]) =>
        `${direction.toUpperCase()}: ${allowed ? "SAFE" : "BLOCKED"}`,
    )
    .join("\n");

  summary_panel.innerHTML = `
                <div class="item"><strong>Turn</strong><span>${sample_state.turn}</span></div>
                <div class="item"><strong>Board</strong><span>${width} × ${height}</span></div>
                <div class="item"><strong>${sample_state.you.name} Health</strong><span>${sample_state.you.health}</span></div>
            `;

  move_analysis.textContent =
    `${safe_strings}\n\n` +
    (debug_data
      ? `Path: ${debug_data.path_type} (${debug_data.path.length} steps)\nSafe ratio: ${(
          debug_data.safe_ratio * 100
        ).toFixed(1)}%`
      : "No debug data available.");

  if (show_debug) renderDebug();
}

async function sendMoveRequest() {
  move_response.textContent = "Sending request...";
  try {
    const response = await fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sample_state),
    });
    const data = await response.json();
    move_response.textContent = JSON.stringify(
      { status: response.status, data },
      null,
      2,
    );
    return data;
  } catch (error) {
    move_response.textContent = `Request failed: ${error.message}`;
    throw error;
  }
}

let loop_interval_ms = 500;
let game_loop_interval = null;
let advance_in_progress = false;

const direction_vectors = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function applySnakeMove(snake_id, move) {
  const vector = direction_vectors[move];
  if (!vector) {
    throw new Error(`Invalid move received: ${move}`);
  }

  const snake = sample_state.board.snakes.find((s) => s.id === snake_id);
  if (!snake) {
    throw new Error(`Snake not found: ${snake_id}`);
  }

  const head = snake.head;
  const new_head = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  const width = sample_state.board.width;
  const height = sample_state.board.height;
  if (
    new_head.x < 0 ||
    new_head.x >= width ||
    new_head.y < 0 ||
    new_head.y >= height
  ) {
    throw new Error(`Snake ${snake_id} moved outside board.`);
  }

  const food_index = sample_state.board.food.findIndex(
    (food) => food.x === new_head.x && food.y === new_head.y,
  );
  const ate_food = food_index !== -1;

  const blocked = new Set();
  sample_state.board.snakes.forEach((s) => {
    s.body.forEach((segment, index) => {
      const is_own_tail =
        s.id === snake_id && index === s.body.length - 1 && !ate_food;
      if (!is_own_tail) {
        blocked.add(getCellKey(segment.x, segment.y));
      }
    });
  });
  if (sample_state.board.hazards) {
    sample_state.board.hazards.forEach((hazard) =>
      blocked.add(getCellKey(hazard.x, hazard.y)),
    );
  }

  if (blocked.has(getCellKey(new_head.x, new_head.y))) {
    throw new Error(`Snake ${snake_id} collided with obstacle.`);
  }

  const new_body = [{ ...new_head }, ...snake.body];
  if (!ate_food) {
    new_body.pop();
  } else {
    sample_state.board.food.splice(food_index, 1);
    let spawn_x, spawn_y;
    let occupied;
    do {
      spawn_x = Math.floor(Math.random() * width);
      spawn_y = Math.floor(Math.random() * height);
      occupied =
        sample_state.board.snakes.some((s) =>
          s.body.some((part) => part.x === spawn_x && part.y === spawn_y),
        ) ||
        sample_state.board.food.some(
          (food) => food.x === spawn_x && food.y === spawn_y,
        );
    } while (occupied);
    sample_state.board.food.push({ x: spawn_x, y: spawn_y });
  }

  snake.body = new_body;
  snake.head = { ...new_head };
  snake.length = new_body.length;
  snake.health = ate_food ? Math.min(100, snake.health + 20) : snake.health - 1;
}

function applyMove(move) {
  applySnakeMove("you", move);
}

function applyEnemyMove() {
  for (const enemy of sample_state.board.snakes) {
    if (enemy.id === "you") continue;
    if (enemy.health <= 0) continue; // Skip dead enemies

    try {
      let move;
      if (enemy.type === "chaser") {
        move = chaser(enemy, sample_state);
      } else if (enemy.type === "foodFinder") {
        move = foodFinder(enemy, sample_state);
      } else {
        move = "up"; // Default fallback
      }

      applySnakeMove(enemy.id, move);
    } catch (error) {
      console.log(`Enemy ${enemy.id} died: ${error.message}`);
      killSnake(enemy.id);
    }
  }
}

function killSnake(snake_id) {
  const snake = sample_state.board.snakes.find((s) => s.id === snake_id);
  if (snake) {
    snake.health = 0;
  }
}

function processDeaths() {
  // Kill snakes with starvation
  for (const snake of sample_state.board.snakes) {
    if (snake.health <= 0) {
      killSnake(snake.id);
    }
  }

  // Check for head-to-head collisions
  for (let i = 0; i < sample_state.board.snakes.length; i++) {
    for (let j = i + 1; j < sample_state.board.snakes.length; j++) {
      const snake_1 = sample_state.board.snakes[i];
      const snake_2 = sample_state.board.snakes[j];

      if (
        snake_1.health > 0 &&
        snake_2.health > 0 &&
        snake_1.head.x === snake_2.head.x &&
        snake_1.head.y === snake_2.head.y
      ) {
        // Head-on collision
        if (snake_1.length > snake_2.length) {
          killSnake(snake_2.id);
        } else if (snake_2.length > snake_1.length) {
          killSnake(snake_1.id);
        } else {
          // Equal length - both die
          killSnake(snake_1.id);
          killSnake(snake_2.id);
        }
      }
    }
  }

  // Remove dead snakes from the board
  sample_state.board.snakes = sample_state.board.snakes.filter(
    (snake) => snake.health > 0,
  );

  // Check if player is dead
  if (!sample_state.board.snakes.find((s) => s.id === "you")) {
    return "Your snake died!";
  }

  return null;
}

async function advanceTurn() {
  if (advance_in_progress) return;
  advance_in_progress = true;
  try {
    const data = await sendMoveRequest();
    debug_data = data.debug;
    const move = data?.data?.move ?? data?.move;
    if (!move) {
      throw new Error("Backend response did not include a move.");
    }

    try {
      applyMove(move);
    } catch (error) {
      // Player hit wall, themselves, or enemy
      console.log(`Player collision: ${error.message}`);
      killSnake("you");
    }

    // Apply moves for all enemy snakes
    applyEnemyMove();

    // Process all deaths (starvation, collision, head-on collision)
    const death_message = processDeaths();
    if (death_message) {
      throw new Error(death_message);
    }

    sample_state.turn += 1;
    renderBoard();
  } catch (error) {
    move_response.textContent = `Game loop stopped: ${error.message}`;
    pauseGameLoop();
  } finally {
    advance_in_progress = false;
  }
}

function renderDebug() {
  // Clear previous overlays
  board_element.querySelectorAll(".debug-overlay").forEach((e) => e.remove());
  const canvas = document.getElementById("debugCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!debug_data) return;
  const { blocked, target, scores, path } = debug_data;
  const width = sample_state.board.width;
  const height = sample_state.board.height;

  // Set canvas size
  const cell_size = 38;
  const gap = 4;
  const board_width = width * cell_size + (width - 1) * gap;
  const board_height = height * cell_size + (height - 1) * gap;
  canvas.width = board_width;
  canvas.height = board_height;
  canvas.style.width = board_width + "px";
  canvas.style.height = board_height + "px";

  // Build a set of cells categorized by accessibility
  const blocked_cells = new Set(blocked.map((b) => `${b.x},${b.y}`));
  const red_cells = new Set(); // actual edge tiles and cells next to snake bodies
  const orange_cells = new Set(); // cells adjacent to red
  const path_cells = new Set(path.map((p) => `${p.x},${p.y}`));
  const food_cells = new Set(
    sample_state.board.food.map((f) => `${f.x},${f.y}`),
  );

  // Mark actual edge tiles as red (distance 0 from boundary)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cellKey = `${x},${y}`;
      if (blocked_cells.has(cellKey)) continue; // skip blocked cells

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

      // Mark as red only if at the actual edge (distance 0)
      if (min_dist_to_edge === 0) {
        red_cells.add(cellKey);
      }
    }
  }

  // Also mark cells next to snake bodies as red (these are blocked anyway)
  for (const other of sample_state.board.snakes) {
    for (const part of other.body) {
      red_cells.add(`${part.x},${part.y}`);
    }
  }

  // Mark cells adjacent to red cells as orange (only if not blocked or red)
  for (const cell_key of red_cells) {
    const [x, y] = cell_key.split(",").map(Number);
    const adjacent = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [ax, ay] of adjacent) {
      if (ax >= 0 && ax < width && ay >= 0 && ay < height) {
        const adjacent_key = `${ax},${ay}`;
        if (!blocked_cells.has(adjacent_key) && !red_cells.has(adjacent_key)) {
          orange_cells.add(adjacent_key);
        }
      }
    }
  }

  // Render cells with new color scheme
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const cell_index = (height - 1 - y) * width + x;
      const cell = board_element.children[cell_index];
      const cell_key = `${x},${y}`;

      // Determine color - priority order matters!
      let color = "#FFD700"; // yellow (default safe)

      if (blocked_cells.has(cell_key)) {
        color = "#1A1A1A"; // black (instant death)
      } else if (food_cells.has(cell_key)) {
        color = "#1BB997"; // teal green (food)
      } else if (path_cells.has(cell_key) && !food_cells.has(cell_key)) {
        color = "#47CF47"; // light green (path)
      } else if (red_cells.has(cell_key)) {
        color = "#BE1010"; // dark red (edges/snake bodies)
      } else if (orange_cells.has(cell_key)) {
        color = "#FF8C00"; // orange (adjacent to red)
      }

      // Create overlay
      if (!(x === sample_state.you.head.x && y === sample_state.you.head.y)) {
        const overlay = document.createElement("div");
        overlay.className = "debug-overlay";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = color;
        overlay.style.borderRadius = "4px";
        cell.appendChild(overlay);
      }
    }
  }

  // Target indicator
  if (target) {
    const cell_index = (height - 1 - target.y) * width + target.x;
    const cell = board_element.children[cell_index];
    const overlay = document.createElement("div");
    overlay.className = "debug-overlay";
    overlay.style.position = "absolute";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.zIndex = "5";
    overlay.style.border =
      "4px solid #fff" + (debug_data.longMode ? " dashed" : "");
    overlay.style.borderRadius = "10px";
    overlay.style.width = "90%";
    overlay.style.height = "90%";
    cell.appendChild(overlay);
  }

  // Path line on canvas
  if (path && path.length > 1) {
    ctx.strokeStyle = "#0300bd";
    ctx.lineWidth = 4;
    ctx.setLineDash(debug_data.pathType === "survival" ? [8, 5] : []);
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const cx = p.x * (cell_size + gap) + cell_size / 2;
      const cy = (height - 1 - p.y) * (cell_size + gap) + cell_size / 2;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function startGameLoop() {
  if (game_loop_interval) return;
  game_loop_interval = setInterval(advanceTurn, loop_interval_ms);
  move_response.textContent = "Game loop running...";
}

function pauseGameLoop() {
  if (!game_loop_interval) return;
  clearInterval(game_loop_interval);
  game_loop_interval = null;
  move_response.textContent = "Game loop paused.";
}

document.getElementById("playBtn").addEventListener("click", startGameLoop);
document.getElementById("pauseBtn").addEventListener("click", pauseGameLoop);
document.getElementById("stepBtn").addEventListener("click", advanceTurn);
document.getElementById("debugToggleBtn").addEventListener("click", () => {
  show_debug = !show_debug;
  document.getElementById("debugToggleBtn").innerHTML = show_debug
    ? 'Hide <i class="fas fa-toggle-on"></i>'
    : 'Show <i class="fas fa-toggle-off"></i>';
  renderDebug();
});
document.getElementById("speedSlider").addEventListener("input", () => {
  loop_interval_ms = parseInt(document.getElementById("speedSlider").value);
  if (game_loop_interval) {
    clearInterval(game_loop_interval);
    game_loop_interval = setInterval(advanceTurn, loop_interval_ms);
  }
  document.getElementById("speedValue").textContent = loop_interval_ms + "ms";
});
renderBoard();
