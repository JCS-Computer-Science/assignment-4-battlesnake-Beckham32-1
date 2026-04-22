export default class FloodFill {
  constructor(game) {
    this.game = game;
    this.grid = Array.from({ length: this.game.board.width }, () =>
      Array.from({ length: this.game.board.height }, () => 0),
    );
  }
  flood() {
    // Mark hazards as dangerous (1)
    if (this.game.board.hazards) {
      for (const hazard of this.game.board.hazards) {
        if (
          hazard.x >= 0 &&
          hazard.x < grid.length &&
          hazard.y >= 0 &&
          hazard.y < this.grid[0].length
        )
          this.grid[hazard.x][hazard.y] = 1;
      }
    }

    // Mark all snake bodies as dangerous (1)
    for (const other of this.game.board.snakes) {
      for (const part of other.body) {
        this.grid[part.x][part.y] = 1;
      }
    }

    // Perform flood fill from head to mark *reachable* empty squares as safe (2)
    this.dfs(this.game.snake.head.x, this.game.snake.head.y);
  }
  dfs(x, y) {
    if (
      x < 0 ||
      x >= this.grid.length ||
      y < 0 ||
      y >= this.grid[0].length ||
      this.grid[x][y] !== 0
    )
      return;

    this.grid[x][y] = 2;
    this.dfs(x + 1, y);
    this.dfs(x - 1, y);
    this.dfs(x, y + 1);
    this.dfs(x, y - 1);
  }
}
