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

const get_cell_key = (x, y) => `${x},${y}`;

function get_safe_moves(state) {
  const head = state.you.head;
  const width = state.board.width;
  const height = state.board.height;
  const blocked = new Set();

  state.board.snakes.forEach((snake) => {
    snake.body.forEach((segment) =>
      blocked.add(get_cell_key(segment.x, segment.y)),
    );
  });
  if (state.board.hazards) {
    state.board.hazards.forEach((hazard) =>
      blocked.add(get_cell_key(hazard.x, hazard.y)),
    );
  }

  return {
    up: head.y + 1 < height && !blocked.has(get_cell_key(head.x, head.y + 1)),
    down: head.y - 1 >= 0 && !blocked.has(get_cell_key(head.x, head.y - 1)),
    left: head.x - 1 >= 0 && !blocked.has(get_cell_key(head.x - 1, head.y)),
    right: head.x + 1 < width && !blocked.has(get_cell_key(head.x + 1, head.y)),
  };
}

function render_board() {
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
      let headX, headY;
      do {
        headX = Math.floor(Math.random() * width);
        headY = Math.floor(Math.random() * height);
      } while (headX < 0 || headX >= width || headY < 0 || headY >= height);
      snake.head = { x: headX, y: headY };
      snake.body = [
        { x: headX, y: headY },
        { x: headX, y: headY - 1 },
        { x: headX, y: headY - 2 },
      ];
      snake.length = snake.body.length;
    });
    sample_state.you = board.snakes[0];
    sample_state.randomized = true;
  }

  // Generate food if not present
  if (board.food.length === 0) {
    for (let i = 0; i < 3; i++) {
      let foodX, foodY;
      let occupied;
      do {
        foodX = Math.floor(Math.random() * width);
        foodY = Math.floor(Math.random() * height);
        occupied = board.snakes.some((snake) =>
          snake.body.some((part) => part.x === foodX && part.y === foodY),
        );
      } while (occupied);
      board.food.push({ x: foodX, y: foodY });
    }
  }

  const cellMap = new Map();
  board.food.forEach((food) =>
    cellMap.set(get_cell_key(food.x, food.y), "food"),
  );
  if (board.hazards) {
    board.hazards.forEach((hazard) =>
      cellMap.set(get_cell_key(hazard.x, hazard.y), "hazard"),
    );
  }
  board.snakes.forEach((snake) => {
    snake.body.forEach((segment, index) => {
      const key = get_cell_key(segment.x, segment.y);
      const type =
        snake.id === sample_state.you.id
          ? index === 0
            ? "you-head"
            : "you-body"
          : index === 0
            ? "enemy-head"
            : "enemy-body";
      cellMap.set(key, type);
    });
  });

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const key = get_cell_key(x, y);
      const type = cellMap.get(key) || "empty";
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
      boardElement.appendChild(cell);
    }
  }

  const safeMoves = getSafeMoves(sample_state);
  const safeStrings = Object.entries(safeMoves)
    .map(
      ([direction, allowed]) =>
        `${direction.toUpperCase()}: ${allowed ? "SAFE" : "BLOCKED"}`,
    )
    .join("\n");

  summaryPanel.innerHTML = `
                <div class="item"><strong>Turn</strong><span>${sample_state.turn}</span></div>
                <div class="item"><strong>Board</strong><span>${width} × ${height}</span></div>
                <div class="item"><strong>${sample_state.you.name} Health</strong><span>${sample_state.you.health}</span></div>
            `;

  moveAnalysis.textContent =
    `${safeStrings}\n\n` +
    (debugData
      ? `Path: ${debugData.pathType} (${debugData.path.length} steps)\nSafe ratio: ${(
          debugData.safeRatio * 100
        ).toFixed(1)}%`
      : "No debug data available.");

  if (showDebug) renderDebug();
}

async function send_move_request() {
  moveResponse.textContent = "Sending request...";
  try {
    const response = await fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sample_state),
    });
    const data = await response.json();
    moveResponse.textContent = JSON.stringify(
      { status: response.status, data },
      null,
      2,
    );
    return data;
  } catch (error) {
    moveResponse.textContent = `Request failed: ${error.message}`;
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

function apply_snake_move(snakeId, move) {
  const vector = direction_vectors[move];
  if (!vector) {
    throw new Error(`Invalid move received: ${move}`);
  }

  const snake = sample_state.board.snakes.find((s) => s.id === snakeId);
  if (!snake) {
    throw new Error(`Snake not found: ${snakeId}`);
  }

  const head = snake.head;
  const newHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  const width = sample_state.board.width;
  const height = sample_state.board.height;
  if (
    newHead.x < 0 ||
    newHead.x >= width ||
    newHead.y < 0 ||
    newHead.y >= height
  ) {
    throw new Error(`Snake ${snakeId} moved outside board.`);
  }

  const foodIndex = sample_state.board.food.findIndex(
    (food) => food.x === newHead.x && food.y === newHead.y,
  );
  const ateFood = foodIndex !== -1;

  const blocked = new Set();
  sample_state.board.snakes.forEach((s) => {
    s.body.forEach((segment, index) => {
      const isOwnTail =
        s.id === snakeId && index === s.body.length - 1 && !ateFood;
      if (!isOwnTail) {
        blocked.add(get_cell_key(segment.x, segment.y));
      }
    });
  });
  if (sample_state.board.hazards) {
    sample_state.board.hazards.forEach((hazard) =>
      blocked.add(get_cell_key(hazard.x, hazard.y)),
    );
  }

  if (blocked.has(get_cell_key(newHead.x, newHead.y))) {
    throw new Error(`Snake ${snakeId} collided with obstacle.`);
  }

  const newBody = [{ ...newHead }, ...snake.body];
  if (!ateFood) {
    newBody.pop();
  } else {
    sample_state.board.food.splice(foodIndex, 1);
    let spawnX, spawnY;
    let occupied;
    do {
      spawnX = Math.floor(Math.random() * width);
      spawnY = Math.floor(Math.random() * height);
      occupied =
        sample_state.board.snakes.some((s) =>
          s.body.some((part) => part.x === spawnX && part.y === spawnY),
        ) ||
        sample_state.board.food.some(
          (food) => food.x === spawnX && food.y === spawnY,
        );
    } while (occupied);
    sample_state.board.food.push({ x: spawnX, y: spawnY });
  }

  snake.body = newBody;
  snake.head = { ...newHead };
  snake.length = newBody.length;
  snake.health = ateFood ? Math.min(100, snake.health + 20) : snake.health - 1;
}

function apply_move(move) {
  apply_snake_move("you", move);
}

function apply_enemy_moves() {
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

function kill_snake(snakeId) {
  const snake = sample_state.board.snakes.find((s) => s.id === snakeId);
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
      const snake1 = sample_state.board.snakes[i];
      const snake2 = sample_state.board.snakes[j];

      if (
        snake1.health > 0 &&
        snake2.health > 0 &&
        snake1.head.x === snake2.head.x &&
        snake1.head.y === snake2.head.y
      ) {
        // Head-on collision
        if (snake1.length > snake2.length) {
          killSnake(snake2.id);
        } else if (snake2.length > snake1.length) {
          killSnake(snake1.id);
        } else {
          // Equal length - both die
          killSnake(snake1.id);
          killSnake(snake2.id);
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
  if (advanceInProgress) return;
  advanceInProgress = true;
  try {
    const data = await send_move_request();
    debugData = data.debug;
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
    apply_enemy_moves();

    // Process all deaths (starvation, collision, head-on collision)
    const deathMessage = processDeaths();
    if (deathMessage) {
      throw new Error(deathMessage);
    }

    sample_state.turn += 1;
    renderBoard();
  } catch (error) {
    moveResponse.textContent = `Game loop stopped: ${error.message}`;
    pauseGameLoop();
  } finally {
    advanceInProgress = false;
  }
}

function renderDebug() {
  // Clear previous overlays
  boardElement.querySelectorAll(".debug-overlay").forEach((e) => e.remove());
  const canvas = document.getElementById("debugCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!debugData) return;
  const { blocked, target, scores, path } = debugData;
  const width = sample_state.board.width;
  const height = sample_state.board.height;

  // Set canvas size
  const cellSize = 38;
  const gap = 4;
  const boardWidth = width * cellSize + (width - 1) * gap;
  const boardHeight = height * cellSize + (height - 1) * gap;
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  canvas.style.width = boardWidth + "px";
  canvas.style.height = boardHeight + "px";

  // Build a set of cells categorized by accessibility
  const blockedCells = new Set(blocked.map((b) => `${b.x},${b.y}`));
  const redCells = new Set(); // actual edge tiles and cells next to snake bodies
  const orangeCells = new Set(); // cells adjacent to red
  const pathCells = new Set(path.map((p) => `${p.x},${p.y}`));
  const foodCells = new Set(
    sample_state.board.food.map((f) => `${f.x},${f.y}`),
  );

  // Mark actual edge tiles as red (distance 0 from boundary)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cellKey = `${x},${y}`;
      if (blockedCells.has(cellKey)) continue; // skip blocked cells

      const distToLeft = x;
      const distToRight = width - 1 - x;
      const distToBottom = y;
      const distToTop = height - 1 - y;
      const minDistToEdge = Math.min(
        distToLeft,
        distToRight,
        distToBottom,
        distToTop,
      );

      // Mark as red only if at the actual edge (distance 0)
      if (minDistToEdge === 0) {
        redCells.add(cellKey);
      }
    }
  }

  // Also mark cells next to snake bodies as red (these are blocked anyway)
  for (const other of sample_state.board.snakes) {
    for (const part of other.body) {
      redCells.add(`${part.x},${part.y}`);
    }
  }

  // Mark cells adjacent to red cells as orange (only if not blocked or red)
  for (const cellKey of redCells) {
    const [x, y] = cellKey.split(",").map(Number);
    const adjacent = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [ax, ay] of adjacent) {
      if (ax >= 0 && ax < width && ay >= 0 && ay < height) {
        const adjKey = `${ax},${ay}`;
        if (!blockedCells.has(adjKey) && !redCells.has(adjKey)) {
          orangeCells.add(adjKey);
        }
      }
    }
  }

  // Render cells with new color scheme
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const cellIndex = (height - 1 - y) * width + x;
      const cell = boardElement.children[cellIndex];
      const cellKey = `${x},${y}`;

      // Determine color - priority order matters!
      let color = "#FFD700"; // yellow (default safe)

      if (blockedCells.has(cellKey)) {
        color = "#1A1A1A"; // black (instant death)
      } else if (foodCells.has(cellKey)) {
        color = "#1BB997"; // teal green (food)
      } else if (pathCells.has(cellKey) && !foodCells.has(cellKey)) {
        color = "#47CF47"; // light green (path)
      } else if (redCells.has(cellKey)) {
        color = "#BE1010"; // dark red (edges/snake bodies)
      } else if (orangeCells.has(cellKey)) {
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
    const cellIndex = (height - 1 - target.y) * width + target.x;
    const cell = boardElement.children[cellIndex];
    const overlay = document.createElement("div");
    overlay.className = "debug-overlay";
    overlay.style.position = "absolute";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.zIndex = "5";
    overlay.style.border =
      "4px solid #fff" + (debugData.longMode ? " dashed" : "");
    overlay.style.borderRadius = "10px";
    overlay.style.width = "90%";
    overlay.style.height = "90%";
    cell.appendChild(overlay);
  }

  // Path line on canvas
  if (path && path.length > 1) {
    ctx.strokeStyle = "#0300bd";
    ctx.lineWidth = 4;
    ctx.setLineDash(debugData.pathType === "survival" ? [8, 5] : []);
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const cx = p.x * (cellSize + gap) + cellSize / 2;
      const cy = (height - 1 - p.y) * (cellSize + gap) + cellSize / 2;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function startGameLoop() {
  if (gameLoopInterval) return;
  gameLoopInterval = setInterval(advanceTurn, loopIntervalMs);
  moveResponse.textContent = "Game loop running...";
}

function pauseGameLoop() {
  if (!gameLoopInterval) return;
  clearInterval(gameLoopInterval);
  gameLoopInterval = null;
  moveResponse.textContent = "Game loop paused.";
}

document.getElementById("playBtn").addEventListener("click", startGameLoop);
document.getElementById("pauseBtn").addEventListener("click", pauseGameLoop);
document.getElementById("stepBtn").addEventListener("click", advanceTurn);
document.getElementById("debugToggleBtn").addEventListener("click", () => {
  showDebug = !showDebug;
  document.getElementById("debugToggleBtn").innerHTML = showDebug
    ? 'Hide <i class="fas fa-toggle-on"></i>'
    : 'Show <i class="fas fa-toggle-off"></i>';
  renderDebug();
});
document.getElementById("speedSlider").addEventListener("input", () => {
  loopIntervalMs = parseInt(document.getElementById("speedSlider").value);
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(advanceTurn, loopIntervalMs);
  }
  document.getElementById("speedValue").textContent = loopIntervalMs + "ms";
});
renderBoard();
