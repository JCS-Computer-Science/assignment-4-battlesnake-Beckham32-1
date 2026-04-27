import flood from "../../ogsrc/ogfloodfill";

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
    this.space_score = 0;
    this.occupied_cells = 0;
    this.free_cells = 0;
    this.space_threshold = phase === "growth" ? 0.8 : 0.6;

    // Astar
    this.astar_grid = Array.from({ length: this.game.board.width}, () =>
      Array.from({ length: this.game.board.height}, () => 0)
    );
  }
  run() {
    this.collision(); // Run collision checks to disable invalid moves

    this.checkPhase(); // Determine game state and game phase (snake behaviour)

    this.simulatePosition(); // Simulate new head position for each move, check for food, and validate collisions
  }
  collision() {
    this.game.collision.walls();
    this.game.collision.self();
    this.game.collision.others();
  }
  checkPhase() {
    if (this.is_largest && this.alive_snakes > 1) {
      this.phase = "attack"; // Snake is largest, hunt small snakes
    }
    if (this.game.snake.health < 40 && this.phase === "attack") {
      this.phase = "emergency"; // Snake is starting to starve, track down food
    }
  }
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

      this.astar();

      const food_targets = snake.board.food.map((f) => ({ x: f.x, y: f.y }));
      const params = {
        snake: this.game.snake,
        new_head: this.new_head,
        will_eat: this.will_eat,
        temp_body: this.temp_body,
        temp_snake: this.temp_snake,
        dir: dir,
        astar_grid: this.astar_grid,
        food_targets: food_targets,
        space_score: this.space_score,
        is_stalemate: this.is_stalemate,
        phase: this.phase,
      }
      this.scorePhase(params); // Score moves based on game phase and position safety
    }
  }
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
  spaceSafety() {
    this.grid = flood(this.temp_snake);
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
  astar() {
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
  scorePhase(params) {
    switch (params.phase) {
      case "attack":
        // Attack logic
        break;
      case "growth":
        // Growth logic
        break;
      case "emergency":
        // Emergency logic
        break;
    }
  }
}
