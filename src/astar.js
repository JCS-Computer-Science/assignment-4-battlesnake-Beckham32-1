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
  run: function (snake) {
    const graph = new Graph([
      [1, 1, 1, 1],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
    ]);
    var start = graph.grid[0][0];
    var end = graph.grid[1][2];
    let result = astar.search(graph, start, end);
    // result is an array containing the shortest path
    var graphDiagonal = new Graph(
      [
        [1, 1, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
      ],
      { diagonal: true },
    );

    var start = graphDiagonal.grid[0][0];
    var end = graphDiagonal.grid[1][2];
    var resultWithDiagonals = astar.search(graphDiagonal, start, end, {
      heuristic: astar.heuristics.diagonal,
    });
    // Weight can easily be added by increasing the values within the graph, and where 0 is infinite (a wall)
    var graphWithWeight = new Graph([
      [1, 1, 2, 30],
      [0, 4, 1.3, 0],
      [0, 0, 5, 1],
    ]);
    var startWithWeight = graphWithWeight.grid[0][0];
    var endWithWeight = graphWithWeight.grid[1][2];
    var resultWithWeight = astar.search(
      graphWithWeight,
      startWithWeight,
      endWithWeight,
    );
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
      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      let currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        let curr = currentNode;
        let ret = [];
        while (curr.parent) {
          ret.push(curr);
          curr = curr.parent;
        }
        return ret.reverse();
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
      let neighbors = astar.neighbors(grid, currentNode, diagonal);

      for (let i = 0, il = neighbors.length; i < il; i++) {
        let neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        let gScore = currentNode.g + neighbor.cost;
        let beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {
          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    // No result was found - empty array signifies failure to find path.
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
