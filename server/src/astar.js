export default class Astar {
  constructor(game) {
    this.game = game;
  }
  // Initialize the grid nodes for A* search
  init(grid) {
    for (let x = 0, xl = grid.length; x < xl; x++) {
      for (let y = 0, yl = grid[x].length; y < yl; y++) {
        let node = grid[x][y];
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.cost = 1;
        node.visited = false;
        node.closed = false;
        node.parent = null;
      }
    }
  }
  // Main function to run A* search for given targets and return the best path
  run(snake, targets, grid, options = {}) {
    if (
      !Array.isArray(grid) &&
      Array.isArray(targets) &&
      targets.length &&
      Array.isArray(targets[0])
    ) {
      grid = targets;
      targets = null;
    }

    options = {
      safe_threshold: 0.8, // Minimum percentage of reachable cells required for a path to be considered safe
      long_mode: false, // Whether to prioritize longer paths (useful for late-game when snake is long)
      survival: false, // If true, will only return a path if it meets the safe threshold, otherwise returns empty path
      ignore_food: false, // If true, will disregard food when calculating safe paths (useful for survival mode)
      ...options,
    };

    if (!grid || !grid.length) return [];

    const width = grid.length;
    const height = grid[0].length;
    const searchable_grid = grid.map((column) =>
      column.map((cell) => (cell === 0 ? 1 : 0)),
    );

    // Check if snake head is in bounds
    if (
      !this.game.snake ||
      !this.game.snake.head ||
      this.game.snake.head.x < 0 ||
      this.game.snake.head.x >= width ||
      this.game.snake.head.y < 0 ||
      this.game.snake.head.y >= height
    )
      return [];

    searchable_grid[this.game.snake.head.x][this.game.snake.head.y] = 1;
    const graph = new Graph(searchable_grid);
    const start = graph.nodes[this.game.snake.head.x][this.game.snake.head.y];

    // Build list of target points based on input targets or default to food and enemy heads
    const target_points = targets
      ? targets
          .map((target) => {
            if (target && typeof target.type === "string") {
              return { x: target.x, y: target.y, type: target.type };
            }
            if (target && target.head) {
              return { x: target.head.x, y: target.head.y, type: "enemy" };
            }
            if (
              target &&
              typeof target.x === "number" &&
              typeof target.y === "number"
            ) {
              return { x: target.x, y: target.y, type: "food" };
            }
            return null;
          })
          .filter(Boolean)
      : [
          ...snake.board.food.map((food) => ({
            x: food.x,
            y: food.y,
            type: "food",
          })),
          ...snake.board.snakes
            .filter(
              (other) =>
                other.id !==
                (this.game.state.you ? this.game.state.you.id : null),
            )
            .map((other) => ({
              x: other.head.x,
              y: other.head.y,
              type: "enemy",
            })),
        ];

    // For each target, find the path and whether it will eat food
    const possible_paths = target_points
      .map((target) => {
        // Check if target is in bounds
        if (
          target.x < 0 ||
          target.x >= width ||
          target.y < 0 ||
          target.y >= height
        )
          return null;

        const end = graph.nodes[target.x][target.y];
        if (!end || end.isWall()) {
          return null;
        }

        const path = this.search(graph.nodes, start, end);
        return path.length
          ? { path, target, will_eat: target.type === "food" }
          : null;
      })
      .filter(Boolean);

    const valid_paths = possible_paths.filter((candidate) =>
      this.isSafePath(
        candidate.path,
        grid,
        options.safe_threshold,
        candidate.will_eat,
      ),
    );

    const has_food_targets = target_points.some(
      (target) => target.type === "food",
    );

    if (!valid_paths.length && has_food_targets && !options.ignore_food) {
      const survival_path = this.findSurvivalPath(grid, {
        ...options,
        ignore_food: true,
      });
      if (survival_path.length) {
        return survival_path;
      }
    }

    const paths = valid_paths.length ? valid_paths : possible_paths;
    if (!paths.length) {
      if (options.survival || target_points.length === 0)
        return this.findSurvivalPath(grid, options);
      return [];
    }

    const use_long_mode =
      options.long_mode === true
        ? true
        : options.long_mode === false
          ? false
          : this.isLongMode(this.game.snake);
    paths.sort((a, b) =>
      use_long_mode
        ? b.path.length - a.path.length
        : a.path.length - b.path.length,
    );
    return paths[0].path;
  }
  // Helper method to create a binary heap for the A* open set
  heap() {
    return new BinaryHeap(function (node) {
      return node.f;
    });
  }
  // A* search algorithm implementation to find path from start to end on the grid
  search(grid, start, end, diagonal, heuristic) {
    this.init(grid);
    heuristic = heuristic || this.manhattan;
    diagonal = !!diagonal;

    let open_heap = this.heap();

    open_heap.push(start);

    // Main A* loop
    while (open_heap.size() > 0) {
      let current_node = open_heap.pop();

      // If we reached the end, reconstruct and return the path
      if (current_node === end) {
        let curr = current_node;
        let ret = [];
        while (curr.parent) {
          ret.push(curr);
          curr = curr.parent;
        }
        return ret.reverse();
      }

      current_node.closed = true;
      let neighbors = this.neighbors(grid, current_node, diagonal);

      // Loop through neighbors of current node
      for (let i = 0, il = neighbors.length; i < il; i++) {
        let neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          continue;
        }

        let g_score = current_node.g + neighbor.cost;
        let been_visited = neighbor.visited;

        if (!been_visited || g_score < neighbor.g) {
          neighbor.visited = true;
          neighbor.parent = current_node;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = g_score;
          neighbor.f = neighbor.g + neighbor.h;

          if (!been_visited) {
            open_heap.push(neighbor);
          } else {
            open_heap.rescoreElement(neighbor);
          }
        }
      }
    }

    return [];
  }
  // Heuristic function to calculate Manhattan distance between two points
  manhattan(pos0, pos1) {
    let d1 = Math.abs(pos1.x - pos0.x);
    let d2 = Math.abs(pos1.y - pos0.y);
    return d1 + d2;
  }
  // Get valid neighboring nodes for a given node, optionally including diagonals
  neighbors(grid, node, diagonals) {
    let ret = [];
    let x = node.x;
    let y = node.y;

    if (grid[x] && grid[x][y + 1]) ret.push(grid[x][y + 1]); // North
    if (grid[x + 1] && grid[x + 1][y]) ret.push(grid[x + 1][y]); // East
    if (grid[x] && grid[x][y - 1]) ret.push(grid[x][y - 1]); // South
    if (grid[x - 1] && grid[x - 1][y]) ret.push(grid[x - 1][y]); // West

    if (diagonals) {
      if (grid[x + 1] && grid[x + 1][y + 1]) ret.push(grid[x + 1][y + 1]); // Northeast
      if (grid[x + 1] && grid[x + 1][y - 1]) ret.push(grid[x + 1][y - 1]); // Southeast
      if (grid[x - 1] && grid[x - 1][y - 1]) ret.push(grid[x - 1][y - 1]); // Southwest
      if (grid[x - 1] && grid[x - 1][y + 1]) ret.push(grid[x - 1][y + 1]); // Northwest
    }

    return ret; // Return list of neighboring nodes
  }
  // Determine if snake is in "long mode" based on its length and health, which can influence pathfinding strategy
  isLongMode() {
    if (this.game.snake.health < 50) return false; // Exit long mode if health is low to prioritize food
    const long_threshold = 25; // Length threshold to consider snake as long (can be adjusted based on board size and game dynamics)
    return this.game.snake.body.length >= long_threshold;
  }
  // Check if coordinates are within bounds of the grid
  inBounds(grid, x, y) {
    return x >= 0 && x < grid.length && y >= 0 && y < grid[0].length;
  }
  // Create a deep copy of the grid to simulate future states without modifying the original
  cloneGrid(grid) {
    return grid.map((column) => column.slice());
  }
  // Count the number of reachable cells from a starting point using BFS, which can be used to evaluate the safety of a path
  countReachableCells(grid, start_x, start_y) {
    if (!this.inBounds(grid, start_x, start_y)) return 0;

    // If starting cell is blocked, return 0
    const visited = Array.from({ length: grid.length }, () =>
      Array(grid[0].length).fill(false),
    );
    const queue = [{ x: start_x, y: start_y }];
    let count = 0;

    visited[start_x][start_y] = true;
    while (queue.length) {
      // BFS loop to explore reachable cells
      const { x, y } = queue.shift();
      if (grid[x][y] === 1) {
        continue;
      }

      count++;
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      // Loop through neighbors and add valid, unvisited ones to the queue
      for (const next of neighbors) {
        if (this.inBounds(grid, next.x, next.y) && !visited[next.x][next.y]) {
          visited[next.x][next.y] = true;
          queue.push(next);
        }
      }
    }

    return count;
  }
  // Simulate the snake's movement along a given path on a projected grid, marking cells as occupied and freeing tail cells as the snake moves, which allows for evaluating future states of the board after taking a path
  simulateProjectedGrid(path, initial_grid, will_eat) {
    const projected = this.cloneGrid(initial_grid);
    const body = this.game.snake.body.map((part) => ({ x: part.x, y: part.y }));

    // Simulate the snake moving along the path, updating the projected grid to reflect occupied cells and freeing tail cells if not eating food
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      body.unshift({ x: step.x, y: step.y });
      if (this.inBounds(projected, step.x, step.y)) {
        projected[step.x][step.y] = 1;
      }

      // If the snake will eat food at the end of the path, it grows and does not free the tail cell on the last step
      const is_last_step = i === path.length - 1;
      if (!will_eat || !is_last_step) {
        const tail = body.pop();
        if (
          this.inBounds(projected, tail.x, tail.y) &&
          (tail.x !== step.x || tail.y !== step.y)
        ) {
          projected[tail.x][tail.y] = 0;
        }
      }
    }

    return projected;
  }
  // Evaluate whether a given path is safe by simulating the snake's movement along the path and counting the number of reachable cells from the end point, ensuring it meets a specified safety threshold to avoid paths that could lead to traps or dead ends
  isSafePath(path, grid, threshold, will_eat) {
    if (!path.length) {
      return false;
    }

    const end = path[path.length - 1];
    const projected_grid = this.simulateProjectedGrid(path, grid, will_eat);

    if (this.inBounds(projected_grid, end.x, end.y)) {
      projected_grid[end.x][end.y] = 0;
    }

    const reachable = this.countReachableCells(projected_grid, end.x, end.y);
    const total = projected_grid.length * projected_grid[0].length;
    return reachable >= threshold * total;
  }
  // Find a path that maximizes reachable space for survival when no safe paths to targets are available, which can help the snake stay alive longer by avoiding traps and keeping options open
  findSurvivalPath(grid, options = {}) {
    const width = grid.length;
    const height = grid[0].length;
    const visited = Array.from({ length: width }, () =>
      Array(height).fill(false),
    );
    const parent = Array.from({ length: width }, () =>
      Array(height).fill(null),
    );
    const queue = [{ x: this.game.snake.head.x, y: this.game.snake.head.y }];

    visited[this.game.snake.head.x][this.game.snake.head.y] = true;

    // Build set of food cells to optionally disregard in survival mode, which can help the snake find paths that maximize open space rather than paths that lead to food which may be surrounded by hazards or enemies
    const food_set = new Set();
    if (this.game.board.food && options.ignore_food) {
      for (const food of this.game.board.food) {
        food_set.add(`${food.x},${food.y}`);
      }
    }

    let farthest = {
      x: this.game.snake.head.x,
      y: this.game.snake.head.y,
      dist: 0,
    };
    let current_dist = 0;
    let layer_count = queue.length;

    // BFS loop to explore the grid and find the cell that is farthest from the snake's head while still being reachable, which can provide a safe area for the snake to move towards when no better options are available
    while (queue.length) {
      const current = queue.shift();
      layer_count--;
      const coord_key = `${current.x},${current.y}`;
      if (
        grid[current.x][current.y] === 0 &&
        (!food_set.size || !food_set.has(coord_key))
      ) {
        if (current_dist >= farthest.dist) {
          farthest = { x: current.x, y: current.y, dist: current_dist };
        }
      }

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      // Loop through neighbors and add valid, unvisited ones to the queue for further exploration
      for (const next of neighbors) {
        if (
          this.inBounds(grid, next.x, next.y) &&
          !visited[next.x][next.y] &&
          grid[next.x][next.y] === 0
        ) {
          visited[next.x][next.y] = true;
          parent[next.x][next.y] = current;
          queue.push(next);
        }
      }

      if (layer_count === 0) {
        layer_count = queue.length;
        current_dist++;
      }
    }

    if (farthest.dist === 0) {
      return [];
    }

    // Reconstruct path from snake's head to the farthest reachable cell found in the BFS
    const path = [];
    let cursor = { x: farthest.x, y: farthest.y };
    while (
      cursor &&
      (cursor.x !== this.game.snake.head.x ||
        cursor.y !== this.game.snake.head.y)
    ) {
      path.push(cursor);
      cursor = parent[cursor.x][cursor.y];
    }

    return path.reverse();
  }
}

// ==================================
// Helper classes for Astar algorithm
// ==================================

// Graph class to represent the grid and its nodes for A* search
class Graph {
  constructor(grid, options) {
    options = options || {};
    this.diagonal = !!options.diagonal;
    this.grid = grid;
    this.width = grid.length;
    this.height = grid[0].length;
    this.nodes = [];

    for (let x = 0; x < this.width; x++) {
      this.nodes[x] = [];

      for (let y = 0; y < this.height; y++) {
        this.nodes[x][y] = new GridNode(x, y, grid[x][y]);
      }
    }
  }
}

// GridNode class to represent each cell in the grid, including its coordinates, weight (whether it's a wall or open), and properties used for A* search such as f, g, h scores and parent node reference
class GridNode {
  constructor(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
  }
  // Method to determine if the node is a wall (non-traversable) based on its weight, which is used in the A* search to skip over blocked cells
  isWall() {
    return this.weight === 0;
  }
}

// BinaryHeap class to implement a priority queue for the A* open set, allowing for efficient retrieval of the node with the lowest f score during the search process
class BinaryHeap {
  constructor(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }
  // Add an element to the heap and maintain the heap property by bubbling it up to its correct position based on its score
  push(element) {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  }
  // Remove and return the element with the lowest score (the root of the heap), then maintain the heap property by sinking down the last element to its correct position
  pop() {
    const result = this.content[0];
    const end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  }
  // Return the number of elements in the heap, which is used to determine if there are still nodes to explore in the A* search
  size() {
    return this.content.length;
  }
  // Update the position of an element in the heap when its score has changed, which is necessary when a better path to a node is found during the A* search
  rescoreElement(node) {
    this.sinkDown(this.content.indexOf(node));
  }
  // Move an element up the heap until it is in the correct position based on its score, which is used when adding a new element or updating an existing element's score
  bubbleUp(n) {
    const element = this.content[n];
    const score = this.scoreFunction(element);
    while (n > 0) {
      const parent_node = Math.floor((n + 1) / 2) - 1;
      const parent = this.content[parent_node];
      if (score >= this.scoreFunction(parent)) break;
      this.content[parent_node] = element;
      this.content[n] = parent;
      n = parent_node;
    }
  }
  // Move an element down the heap until it is in the correct position based on its score, which is used when removing the root element and replacing it with the last element in the heap
  sinkDown(n) {
    const length = this.content.length;
    const element = this.content[n];
    const element_score = this.scoreFunction(element);

    while (true) {
      const child_2n = (n + 1) * 2;
      const child_1n = child_2n - 1;
      let swap = null;
      let child_1_score;
      if (child_1n < length) {
        const child_1 = this.content[child_1n];
        child_1_score = this.scoreFunction(child_1);
        if (child_1_score < element_score) swap = child_1n;
      }
      if (child_2n < length) {
        const child_2 = this.content[child_2n];
        const child_2_score = this.scoreFunction(child_2);
        if (child_2_score < (swap == null ? element_score : child_1_score))
          swap = child_2n;
      }
      if (swap == null) break;
      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }
}
