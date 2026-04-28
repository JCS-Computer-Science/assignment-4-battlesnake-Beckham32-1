export default class Score {
  constructor(game) {
    this.game = game;

    // Gamestate and Phase
    this.phase = "growth";
    this.length = game.snake.body.length;
    this.largest_opponent = this.game.board.snakes
      .filter((snake) => snake.id !== this.game.state.you.id)
      .reduce(
        (max, snake) => (snake.body.length > max.body.length ? snake : max),
        {
          body: { length: 0 },
        },
      );
    this.is_largest = this.is_largest =
      this.length > this.largest_opponent.body.length;

    // Stalemate Scenario: 2 alive, similar size
    this.alive_snakes = game.board.snakes.length;
    this.size_difference = Math.abs(
      this.length - this.largest_opponent.body.length,
    );
    this.is_stalemate = this.alive_snakes === 2 && this.size_difference <= 3;

    // Position Simulation
    this.directions = ["up", "down", "left", "right"];
    this.new_head = { ...this.game.snake.head };
    this.will_eat = this.game.board.food.some(
      (food) => food.x === new_head.x && food.y === new_head.y,
    );
    this.temp_body = [{ ...this.new_head }, ...this.game.snake.body];
    this.temp_snake = {
      ...this.game.snake,
      head: this.new_head,
      body: this.temp_body,
    };

    // Space Safety
    this.grid = null;
    this.occupied_cells = 0;
    this.free_cells = 0;
    this.space_threshold = phase === "growth" ? 0.8 : 0.6;

    // Astar
    this.astar_grid = Array.from({ length: this.game.board.width }, () =>
      Array.from({ length: this.game.board.height }, () => 0),
    );

    // Scoring
    this.space_score = 0;
    this.food_score = 0;
    this.center_score = 0;
    this.hunt_score = 0;

    // Moves
    this.best_move = null;
    this.best_score = -Infinity;
  }
  // Initializes values and begins checks
  init() {
    this.collision();

    this.checkPhase();

    return this.simulatePosition();
  }
  // Run collision checks to disable invalid moves
  collision() {
    this.game.collision.walls();
    this.game.collision.self();
    this.game.collision.others();
  }
  // Determine game phase (snake behaviour)
  checkPhase() {
    if (this.game.snake.health === 100 && this.game.board.food.length > 0) {
      this.phase = "growth"; // Default phase, snake is growing and should prioritize food
    }
    if (this.is_largest && this.alive_snakes > 1) {
      this.phase = "attack"; // Snake is largest, hunt small snakes
    }
    if (this.game.snake.health < 40 && this.phase === "attack") {
      this.phase = "emergency"; // Snake is starting to starve, track down food
    }
  }
  // Simulates the new head position for each possible move, checks for food, validates collisions, evaluates space safety, runs Astar, and scores based on game phase
  simulatePosition() {
    for (const dir of this.directions) {
      // Kill invalid move scores
      if (!this.game.snake.move[dir]) {
        this.game.snake.scores[dir] = -Infinity;
        continue;
      }

      // Simulate new head position
      const new_head = { ...snake.head };
      if (dir === "up") this.new_head.y += 1;
      else if (dir === "down") this.new_head.y -= 1;
      else if (dir === "left") this.new_head.x -= 1;
      else if (dir === "right") this.new_head.x += 1;

      // Check if this move would eat food, if no kill new body
      this.will_eat = snake.board.food.some(
        (food) => food.x === new_head.x && food.y === new_head.y,
      );
      this.temp_body = [{ ...new_head }, ...snake.body];
      if (!will_eat) temp_body.pop();

      // Collision validation for simulated position
      if (!this.game.collision.isPositionSafe(this.new_head, !this.will_eat)) {
        this.game.snake.scores[dir] = -Infinity;
        continue;
      }
      if (this.wouldTrap()) {
        snake.scores[dir] = -Infinity;
        continue;
      }

      this.temp_snake = {
        ...this.snake,
        head: this.new_head,
        body: this.temp_body,
      };

      this.spaceSafety();

      if (this.space_score < this.free_cells * this.space_threshold) {
        this.game.snake.scores[dir] = -Infinity;
        continue;
      }

      this.astarPre();

      const food_targets = snake.board.food.map((f) => ({ x: f.x, y: f.y }));
      this.scorePhase(dir, food_targets); // Score moves based on game phase and position safety
      return this.findBestMove();
    }
  }
  // Evaluates the safety of the position by running a flood fill to count free spaces and comparing to occupied cells to determine if this move would trap the snake in a confined area
  spaceSafety() {
    this.grid = this.game.flood.flood(this.temp_snake);
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[0].length; y++) {
        if (this.grid[x][y] === 2) this.space_score++;
      }
    }

    for (const other of this.game.board.snakes) {
      this.occupied_cells += other.body.length;
    }
    if (this.board.hazards) {
      this.occupied_cells += this.game.board.hazards.length;
    }
    this.free_cells =
      this.game.board.width * this.game.board.height - this.occupied_cells;
  }
  // Marks other snakes, hazards, and own body (except new head) as obstacles for Astar pathfinding
  astarPre() {
    for (const other of this.game.board.snakes) {
      if (other.id === this.game.state.you.id) continue;
      for (const part of other.body) {
        this.astar_grid[part.x][part.y] = 1; // Mark other snakes as obstacles
      }
    }
    for (const part of this.temp_body) {
      this.astar_grid[part.x][part.y] = 1; // Mark own body as obstacle (except new head)
    }
    if (this.game.board.hazards) {
      for (const hazard of this.game.board.hazards) {
        this.astar_grid[hazard.x][hazard.y] = 1; // Mark hazards as obstacles
      }
    }
  }
  // Scores moves based on game phase and position safety
  scorePhase(dir, food_targets) {
    switch (this.phase) {
      case "growth":
        // Growth scoring (growth phase occurs by default and routes the snake towards the closest food)
        const growth_food_path =
          this.game.astar.run(this.temp_snake, food_targets, this.astar_grid, {
            safe_threshold: 0.6,
            long_mod: false,
            survival: false,
          }) || [];

        this.food_score = this.will_eat
          ? 2000 // Massive bonus for eating
          : growth_food_path.length
            ? -growth_food_path.length * 5 // Penalize long paths
            : -2000; // Heavy penalty if no path to food
        this.food_score +=
          growth_food_path && this.isOnPath(growth_food_path) ? 500 : 0; // Reward being on a path towards food

        this.game.snake.scores[dir] = this.food_score + this.space_score * 2;
        break;
      case "attack":
        // Attack scoring (attack phase occurs when the snake is larger than other snakes and will allow more freedom in the snakes movement choices [hunting, center safety])
        this.center_score =
          -(
            Math.abs(this.new_head.x - this.game.board.center.x) +
            Math.abs(this.new_head.y - this.game.board.center.y)
          ) * 2;

        for (const other of this.game.board.snakes) {
          if (
            other.id === this.game.state.you.id ||
            other.body.length >= this.snake.body.length
          )
            continue;

          const dist_to_enemy =
            Math.abs(this.new_head.x - other.head.x) +
            Math.abs(this.new_head.y - other.head.y);

          this.hunt_score += (20 - Math.min(dist_to_enemy, 20)) * 10; // Reward being close to smaller snakes
        }

        // Only use long_mode in stalemate scenarios
        const attack_food_path =
          this.game.astar.run(this.temp_snake, food_targets, this.astar_grid, {
            safe_threshold: 0.5,
            long_mode: this.is_stalemate,
            survival: false,
          }) || [];

        this.food_score = this.will_eat
          ? 500 // Moderate bonus for eating (lower priority than hunting)
          : attack_food_path.length &&
            (this.food_score = attack_food_path.length * 0.5); // Slightly penalize getting too far from food

        this.game.snake.scores[dir] =
          this.center_score +
          this.hunt_score +
          this.food_score +
          this.space_score * 1;
        break;
      case "emergency":
        // Emergency scoring (emergency phase kicks in when the snake health drops below 50% and forces the snake to go for food [potential for a drop everything and just go for food phase])
        const emergency_food_path =
          this.astar.run(this.temp_snake, food_targets, this.astar_grid, {
            safe_threshold: 0.5,
            long_mode: false,
            survival: true,
          }) || [];

        this.food_score = this.will_eat
          ? 5000 // Highest priority
          : emergency_food_path.length
            ? -emergency_food_path.length * 6 // Heavily penalize long paths
            : -4000; // Critical if no food path
        this.food_score +=
          emergency_food_path && this.isOnPath(emergency_food_path) ? 500 : 0; // Reward being on a path towards food

        this.game.snake.scores[dir] = this.food_score + this.space_score * 1;
        break;
    }
  }
  findBestMove() {
    // Find best move
    for (const [move, move_score] of Object.entries(this.game.snake.scores)) {
      if (move_score > this.best_score) {
        this.best_score = move_score;
        this.best_move = move;
      }
    }

    // Ensure the selected move is actually valid
    if (
      !this.best_move ||
      !this.game.snake.moves[this.best_move] ||
      this.best_score === -Infinity
    ) {
      let fallback_move = null;
      let fallback_score = -Infinity;
      for (const [move, valid] of Object.entries(this.game.snake.moves)) {
        if (valid && this.game.snake.scores[move] > fallback_score) {
          fallback_score = this.game.snake.scores[move];
          fallback_move = move;
        }
      }
      if (fallback_move) {
        this.best_move = fallback_move;
      }
    }

    if (Object.values(this.game.snake.moves).filter((v) => v).length === 1) {
      this.best_move = Object.keys(this.game.snake.moves).find(
        (k) => this.game.snake.moves[k],
      );
    }

    if (!this.best_move || !this.game.snake.moves[this.best_move]) {
      for (const [move, valid] of Object.entries(this.game.snake.moves)) {
        if (valid) {
          return move;
        }
      }
      return "up";
    }

    return this.best_move;
  }
  // Helper to check if the simulated move is on the Astar path towards food (used to reward moves that are heading in the right direction even if they aren't currently eating)
  isOnPath(path_type) {
    return (
      path_type.length > 0 &&
      path_type[0].x === new_head.x &&
      path_type[0].y === new_head.y
    );
  }
  // Helper to check if the simulated move would trap the snake with no viable next moves
  wouldTrap() {
    if (!this.will_eat) this.temp_body.pop();

    // Check all 4 possible next moves from this position
    const potential_moves = [
      { x: new_head.x, y: new_head.y + 1, dir: "up" },
      { x: new_head.x, y: new_head.y - 1, dir: "down" },
      { x: new_head.x - 1, y: new_head.y, dir: "left" },
      { x: new_head.x + 1, y: new_head.y, dir: "right" },
    ];
    let viable_next_moves = 0;

    for (const next_move of potential_moves) {
      if (this.game.collision.isPositionSafe(next_move, this.will_eat)) {
        viable_next_moves++;
      }
    }

    // If no viable next moves exist, this move would trap the snake
    return viable_next_moves === 0;
  }
}
