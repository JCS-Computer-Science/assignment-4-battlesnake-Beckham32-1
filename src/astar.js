class Astar {
  static init(grid) {
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

  static run(snake, targets, grid) {
    if (
      !Array.isArray(grid) &&
      Array.isArray(targets) &&
      targets.length &&
      Array.isArray(targets[0])
    ) {
      grid = targets;
      targets = null;
    }

    if (!grid || !grid.length) {
      return [];
    }

    const searchableGrid = grid.map((column) =>
      column.map((cell) => (cell === 0 ? 1 : 0)),
    );

    if (
      snake.head.x < 0 ||
      snake.head.x >= searchableGrid.length ||
      snake.head.y < 0 ||
      snake.head.y >= searchableGrid[0].length
    ) {
      return [];
    }

    searchableGrid[snake.head.x][snake.head.y] = 1;
    const graph = new Graph(searchableGrid);
    const start = graph.nodes[snake.head.x][snake.head.y];

    const targetPoints = targets
      ? targets
          .map((target) => {
            if (
              target &&
              typeof target.x === "number" &&
              typeof target.y === "number"
            ) {
              return { x: target.x, y: target.y, type: "food" };
            }
            if (target && target.head) {
              return { x: target.head.x, y: target.head.y, type: "enemy" };
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
            .filter((other) => other.id !== snake.game.you.id)
            .map((other) => ({
              x: other.head.x,
              y: other.head.y,
              type: "enemy",
            })),
        ];

    const possiblePaths = targetPoints
      .map((target) => {
        if (
          target.x < 0 ||
          target.x >= graph.width ||
          target.y < 0 ||
          target.y >= graph.height
        ) {
          return null;
        }

        const end = graph.nodes[target.x][target.y];
        if (!end || end.isWall()) {
          return null;
        }

        const path = Astar.search(graph.nodes, start, end);
        return path.length ? { path, target } : null;
      })
      .filter(Boolean);

    if (!possiblePaths.length) {
      return [];
    }

    possiblePaths.sort((a, b) => a.path.length - b.path.length);
    return possiblePaths[0].path;
  }

  static heap() {
    return new BinaryHeap(function (node) {
      return node.f;
    });
  }

  static search(grid, start, end, diagonal, heuristic) {
    Astar.init(grid);
    heuristic = heuristic || Astar.manhattan;
    diagonal = !!diagonal;

    let openHeap = Astar.heap();

    openHeap.push(start);

    while (openHeap.size() > 0) {
      let currentNode = openHeap.pop();

      if (currentNode === end) {
        let curr = currentNode;
        let ret = [];
        while (curr.parent) {
          ret.push(curr);
          curr = curr.parent;
        }
        return ret.reverse();
      }

      currentNode.closed = true;
      let neighbors = Astar.neighbors(grid, currentNode, diagonal);

      for (let i = 0, il = neighbors.length; i < il; i++) {
        let neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          continue;
        }

        let gScore = currentNode.g + neighbor.cost;
        let beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;

          if (!beenVisited) {
            openHeap.push(neighbor);
          } else {
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    return [];
  }

  static manhattan(pos0, pos1) {
    let d1 = Math.abs(pos1.x - pos0.x);
    let d2 = Math.abs(pos1.y - pos0.y);
    return d1 + d2;
  }

  static neighbors(grid, node, diagonals) {
    let ret = [];
    let x = node.x;
    let y = node.y;

    // West
    if (grid[x - 1] && grid[x - 1][y]) {
      ret.push(grid[x - 1][y]);
    }

    // East
    if (grid[x + 1] && grid[x + 1][y]) {
      ret.push(grid[x + 1][y]);
    }

    // South
    if (grid[x] && grid[x][y - 1]) {
      ret.push(grid[x][y - 1]);
    }

    // North
    if (grid[x] && grid[x][y + 1]) {
      ret.push(grid[x][y + 1]);
    }

    if (diagonals) {
      // Southwest
      if (grid[x - 1] && grid[x - 1][y - 1]) {
        ret.push(grid[x - 1][y - 1]);
      }

      // Southeast
      if (grid[x + 1] && grid[x + 1][y - 1]) {
        ret.push(grid[x + 1][y - 1]);
      }

      // Northwest
      if (grid[x - 1] && grid[x - 1][y + 1]) {
        ret.push(grid[x - 1][y + 1]);
      }

      // Northeast
      if (grid[x + 1] && grid[x + 1][y + 1]) {
        ret.push(grid[x + 1][y + 1]);
      }
    }

    return ret;
  }
}

export const astar = Astar;

// Helper classes for Astar algorithm
class Graph {
  constructor(grid, options) {
    options = options || {};
    this.diagonal = !!options.diagonal;
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0].length;
    this.nodes = [];

    for (let x = 0; x < this.width; x++) {
      this.nodes[x] = [];

      for (let y = 0; y < this.height; y++) {
        this.nodes[x][y] = new GridNode(x, y, grid[y][x]);
      }
    }
  }
}

class GridNode {
  constructor(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
  }

  isWall() {
    return this.weight === 0;
  }
}

class BinaryHeap {
  constructor(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }
  push(element) {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  }
  pop() {
    const result = this.content[0];
    const end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  }
  size() {
    return this.content.length;
  }
  rescoreElement(node) {
    this.sinkDown(this.content.indexOf(node));
  }
  bubbleUp(n) {
    const element = this.content[n];
    const score = this.scoreFunction(element);
    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.content[parentN];
      if (score >= this.scoreFunction(parent)) break;
      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }
  }
  sinkDown(n) {
    const length = this.content.length;
    const element = this.content[n];
    const elemScore = this.scoreFunction(element);

    while (true) {
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      let swap = null;
      let child1Score;
      if (child1N < length) {
        const child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);
        if (child1Score < elemScore) swap = child1N;
      }
      if (child2N < length) {
        const child2 = this.content[child2N];
        const child2Score = this.scoreFunction(child2);
        if (child2Score < (swap == null ? elemScore : child1Score))
          swap = child2N;
      }
      if (swap == null) break;
      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }
}
