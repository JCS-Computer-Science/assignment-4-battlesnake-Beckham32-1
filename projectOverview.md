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

I was too lazy to fix these problems or finish parts of the logic

1. **`collision.js`** contains several bugs:
   - walls() assigns snake.moves.left = snake.head.x <= 0, which is backwards.
   - self() and others() repeatedly overwrite snake.moves for every body segment instead of disabling only the relevant direction.
   - The code uses direct coordinate comparisons for entire move state instead of checking the specific target cell.
   - Result: collision filtering can be wrong, and safe moves may be miscomputed.

   _Should be easier to debug once everything is fully written and I can get to testing_

2. **`floodfill.js`** appears to be broken:
   - dfs(grid, snake.head.x, snake.head.y, 1, grid[snake.head.x][snake.head.y])
   - The target passed to dfs is 1, while the head cell is typically 4.
     This means the DFS likely does nothing, so the floodfill does not produce a meaningful reachable-space map.

   _Should be easier to debug once everything is fully written and I can get to testing_

3. **`astar.js`** is missing logic:
   - Maps the floodfill grid into a binary passable/wall grid
   - Finds the nearest food or enemy head target
   - Returns a path array
     However:
   - The repository does not include a BinaryHeap implementation in astar.js or elsewhere, so astar.search() may fail at runtime.
   - astar.run() returns a path but the path is not used by main.js to modify score values.
   - There is no weighting for distance or move preference in the returned path.

   _This whole algorithm is complicated, I just need to do more research and spend more time with it_

4. **`score.js`** is too simple:
   - valid move → keep current score or 0
   - invalid move → -Infinity
     This means move choice depends mostly on whether moves are allowed, not on real path or food value.

   _Kind of obvious as it was just temp anyway but does need to be fixed_

5. Debug frontend is unfinished
   - `index.html` is a good local tester, but it only tests the sample hard-coded state.
   - It does not validate the actual Battlesnake board state format beyond simple rendering.
   - The backend /move endpoint returns whatever main.js chooses, but the debug page may hide whether the move logic is truly safe in other states.

   _Again just need more of the logic to be written for this to be more functional_

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
