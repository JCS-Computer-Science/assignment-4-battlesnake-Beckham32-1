export default function flood(snake) {
  const grid = Array.from({ length: snake.board.width }, () =>
    Array.from({ length: snake.board.height }, () => 0),
  );

  // Mark hazards as dangerous (1)
  if (snake.board.hazards) {
    for (const hazard of snake.board.hazards) {
      grid[(hazard.x, hazard.y)] = 1;
    }
  }

  // Mark all snake bodies as dangerous (1)
  for (const other of snake.board.snakes) {
    for (const part of other.body) {
      grid[part.x][part.y] = 1;
    }
  }

  // Perform flood fill from head to mark reachable empty squares as safe (2)
  dfs(grid, snake.head.x, snake.head.y);
  return grid;
}

// Recursive depth first search
function dfs(grid, x, y) {
  if (
    x < 0 ||
    x >= grid.length ||
    y < 0 ||
    y >= grid[0].length ||
    grid[x][y] !== 0
  ) {
    return;
  }

  grid[x][y] = 2;
  dfs(grid, x + 1, y);
  dfs(grid, x - 1, y);
  dfs(grid, x, y + 1);
  dfs(grid, x, y - 1);
}
