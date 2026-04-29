export default class Debug {
  constructor(game) {
    this.game = game;

    this.width = this.game.board.width;
    this.height = this.game.board.height;
    this.grid = Array.from({ length: this.width }, () =>
      Array.from({ length: this.height }, () => 0),
    );
    this.blocked = [];

    this.food_targets = this.game.board.food.map((food) => ({
      x: food.x,
      y: food.y,
    }));
    this.min_dist = Infinity;
    this.target = null;

    this.score_grid = Array.from({ length: this.width }, () =>
      Array.from({ length: this.height }, () => 0),
    );
  }
  run() {
    this.markBlocked();

    this.targetFood();

    return this.testScoring();
  }
  markBlocked() {
    // Mark blocked cells
    for (const other of this.game.board.snakes) {
      for (const part of other.body) {
        this.grid[part.x][part.y] = 1;
      }
    }
    // Guard in case gamemode has no hazards
    if (this.game.board.hazards) {
      for (const hazard of this.game.board.hazards) {
        this.grid[hazard.x][hazard.y] = 1;
      }
    }

    // Any cells the snake has no access to (will kill it)
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.grid[x][y] === 1) {
          this.blocked.push({ x, y });
        }
      }
    }
  }
  targetFood() {
    for (const food of this.food_targets) {
      const dist =
        Math.abs(food.x - this.game.snake.head.x) +
        Math.abs(food.y - this.game.snake.head.y);
      if (this.dist < this.min_dist) {
        this.min_dist = this.dist;
        this.target = this.food;
      }
    }
  }
  // Deprecated, needs to be updated to use new phase system
  testScoring() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.grid[x][y] === 1) continue;

        const test_head = { x, y };
        const test_body = [test_head, ...this.game.snake.body];
        if (test_body.length > 1) test_body.pop();
        const test_snake = {
          ...this.game.snake,
          head: test_head,
          body: test_body,
        };

        const test_grid = this.game.flood.flood(test_snake);
        let test_space_score = 0;
        for (let tx = 0; tx < test_grid.length; tx++) {
          for (let ty = 0; ty < test_grid[0].length; ty++) {
            if (test_grid[tx][ty] === 2) test_space_score++;
          }
        }

        const will_eat = this.food_targets.some(
          (food) => food.x === x && food.y === y,
        );
        const test_temp_body = [{ x, y }, ...this.game.snake.body];
        if (!will_eat) test_temp_body.pop();

        const test_astar_grid = Array.from({ length: this.width }, () =>
          Array.from({ length: this.height }, () => 0),
        );
        for (const other of this.game.board.snakes) {
          if (other.id === this.game.state.you.id) continue;
          for (const part of other.body) {
            test_astar_grid[part.x][part.y] = 1;
          }
        }
        for (const part of test_temp_body) {
          test_astar_grid[part.x][part.y] = 1;
        }
        if (this.game.board.hazards) {
          for (const hazard of this.game.board.hazards) {
            test_astar_grid[hazard.x][hazard.y] = 1;
          }
        }

        const test_food_path =
          this.game.astar.run(test_snake, this.food_targets, test_astar_grid, {
            safe_threshold: 0.8,
            long_mode: this.game.astar.isLongMode(this.game.snake),
            survival: true,
          }) || [];

        let test_food_score = 0;
        if (will_eat) {
          test_food_score = 1000;
        } else if (test_food_path && test_food_path.length) {
          test_food_score = -test_food_path.length * 2;
        }

        const dist_to_left = x;
        const dist_to_right = this.width - 1 - x;
        const dist_to_bottom = y;
        const dist_to_top = this.height - 1 - y;
        const min_dist_to_edge = Math.min(
          dist_to_left,
          dist_to_right,
          dist_to_bottom,
          dist_to_top,
        );
        const edge_penalty = Math.max(0, 700 - min_dist_to_edge * 140);
        this.score_grid[x][y] =
          test_space_score * 5 + test_food_score - edge_penalty;
      }
    }

    const safe_food_path = this.game.astar.run(
      this.game.snake,
      this.food_targets,
      this.grid,
      {
        safe_threshold: 0.8,
        survival: false,
      },
    );
    const effective_path = this.game.astar.run(
      this.game.snake,
      this.food_targets,
      this.grid,
      {
        safe_threshold: 0.8,
        survival: true,
      },
    );
    const path_type = safe_food_path.length ? "safe-food" : "survival";
    if (path_type === "survival" && effective_path.length) {
      target = effective_path[effective_path.length - 1];
    }

    let reachable_cells = 0;
    let safe_ratio = 0;
    if (effective_path.length) {
      const end = effective_path[effective_path.length - 1];
      const will_eat = this.food_targets.some(
        (food) => food.x === end.x && food.y === end.y,
      );
      const projected = this.game.astar.simulateProjectedGrid(
        effective_path,
        this.grid,
        will_eat,
      );
      if (this.game.astar.inBounds(projected, end.x, end.y)) {
        projected[end.x][end.y] = 0;
      }
      reachable_cells = this.game.astar.countReachableCells(
        projected,
        end.x,
        end.y,
      );
      safe_ratio =
        this.width * this.height > 0
          ? reachable_cells / (this.width * this.height)
          : 0;
    }

    return {
      blocked: this.blocked,
      target: this.target,
      scores: this.score_grid,
      path: effective_path,
      path_type,
      long_mode: this.game.astar.isLongMode(this.game.snake),
      reachable_cells,
      total_cells: this.width * this.height,
      safe_ratio,
    };
  }
}
