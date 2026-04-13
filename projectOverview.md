# Project Overview

This repository is a Battlesnake starter app built on Node.js / Express, extended with a local debug frontend. It is organized into:

- **`index.js`**: server entrypoint and Battlesnake HTTP API
- **`main.js`**: move decision coordinator
- **`index.html`**: local debug UI for testing with a hard-coded sample game state
- **`/src`**: helper modules for collision, floodfill, pathfinding, and scoring

---

## Current Structure

Subject to change:

**`index.js`**

- Sets up an Express server
- Serves:
  - GET / -> Battlesnake info config
  - GET /debug -> debug frontend
  - POST /move -> calls `move(req.body)`
  - POST /start -> just returns status 200
  - POST /end -> just returns status 200

**`main.js`**

- Builds a snake object from `gameState`
- Tracks:
  - `snake.head`
  - `snake.body`
  - `snake.board`
  - `snake.moves`
  - `snake.scores`
- Runs:
  - collision checks
  - floodfill
  - A\* pathfinding toward food and enemy heads
  - final scoring
- Returns one move string like `{ move: "up" }`

**`index.html`**

- Contains a basic frontend test harness
- Uses a hard-coded temp game state (very temporary)
- Renders the board
- Shows raw state and safe-move analysis
- Sends a POST to /move and displays the backend response

**`collision.js`**

- Implements walls, self, and others checks
- Intended to disable invalid moves

**`floodfill.js`**

- Builds a grid from board width/height
- Marks snake bodies
- Performs DFS from the snake head

**`astar.js`**

- Defines Graph / GridNode
- Implements `astar.run()` and `astar.search()`
- Uses the grid to compute paths to food or enemy head targets

**`score.js`**

- Converts allowed moves into numeric scores
- Unsafe moves become -Infinity

---

## Data Flow

1. Client sends POST /move with Battlesnake game state.
2. **`main.js`** creates the snake object.
3. collision filters moves.
4. floodfill creates a grid representation.
5. `astar.run()` finds a path from the snake head to targets.
6. `score(snake)` finalizes the move ranking.
7. The server returns the chosen move.

---

## Current Bugs and Issues

1. Debug frontend is unfinished
   - does not actually run
   - nothing other than snake objects to aid in debugging
     - pathfinding trace, floodfill overlay, trajectory

---

## Next Steps

'Quick' Fixes

- Fix `collision.js` so each direction is disabled only when its target coordinate is blocked.
- Correct `floodfill.js` to flood from the head into empty tiles only.
- Add or import a proper BinaryHeap or replace heap logic with a simpler queue/priority queue.

Pathfinding integration

- Use `astar.run()` output to adjust move scores directly.
- For example:
  if path to food exists, boost moves in that direction
  if path to enemy head exists, optionally avoid or pursue
- If no path exists, fall back to safe move selection only.
