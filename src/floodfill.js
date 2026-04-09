export default function flood(snake) {
  // 0 = empty, 2 = other snake body, 4 = own snake body
  const grid = Array.from({ length: snake.board.width }, () =>
    Array.from({ length: snake.board.height }, () => 0),
  );

  for (const other of snake.board.snakes) {
    const self = other === snake.game.you || other.id === snake.game.you.id;
    const marker = self ? 4 : 2;
    for (const part of other.body) {
      grid[part.x][part.y] = marker;
    }
  }

  dfs(grid, snake.head.x, snake.head.y, 1, grid[snake.head.x][snake.head.y]);
  return grid;
}

function dfs(grid, x, y, target, start) {
  if (
    x < 0 ||
    x >= grid.length ||
    y < 0 ||
    y >= grid[0].length ||
    grid[x][y] !== target
  ) {
    return;
  }

  grid[x][y] = target;
  dfs(grid, x + 1, y, target, start);
  dfs(grid, x - 1, y, target, start);
  dfs(grid, x, y + 1, target, start);
  dfs(grid, x, y - 1, target, start);
}
