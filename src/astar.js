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
        this.nodes[x][y] = new GridNode(x, y, grid[x][y]);
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

export const astar = {
  init: function (grid) {
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
  },
  run: function (snake, targets, grid) {
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
    const start = graph.grid[snake.head.x][snake.head.y];

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

        const end = graph.grid[target.x][target.y];
        if (!end || end.isWall()) {
          return null;
        }

        const path = astar.search(graph, start, end);
        return path.length ? { path, target } : null;
      })
      .filter(Boolean);

    if (!possiblePaths.length) {
      return [];
    }

    possiblePaths.sort((a, b) => a.path.length - b.path.length);
    return possiblePaths[0].path;
  },
  heap: function () {
    return new BinaryHeap(function (node) {
      return node.f;
    });
  },
  search: function (grid, start, end, diagonal, heuristic) {
    astar.init(grid);
    heuristic = heuristic || astar.manhattan;
    diagonal = !!diagonal;

    let openHeap = astar.heap();

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
      let neighbors = astar.neighbors(grid, currentNode, diagonal);

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
  },
  manhattan: function (pos0, pos1) {
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html

    let d1 = Math.abs(pos1.x - pos0.x);
    let d2 = Math.abs(pos1.y - pos0.y);
    return d1 + d2;
  },
  neighbors: function (grid, node, diagonals) {
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
  },
};
