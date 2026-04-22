export default class Collision {
  constructor(game) {
    this.game = game;
  }
  walls() {
    // Disable moves that go out of bounds
    if (this.game.snake.head.x - 1 < 0) this.game.snake.moves.left = false;
    if (this.game.snake.head.x + 1 >= this.game.board.width)
      this.game.snake.moves.right = false;
    if (this.game.snake.head.y + 1 >= this.game.board.height)
      this.game.snake.moves.up = false;
    if (this.game.snake.head.y - 1 < 0) this.game.snake.moves.down = false;
  }
  self() {
    // Prevent snake turning 180deg into itself
    if (this.game.snake.body[1]) {
      if (this.game.snake.head.x - 1 === this.game.snake.body[1].x)
        this.game.snake.moves.left = false;
      if (this.game.snake.head.x + 1 === this.game.snake.body[1].x)
        this.game.snake.moves.right = false;
      if (this.game.snake.head.y + 1 === this.game.snake.body[1].y)
        this.game.snake.moves.up = false;
      if (this.game.snake.head.y - 1 === this.game.snake.body[1].y)
        this.game.snake.moves.down = false;
    }

    // Prevent hitting own body
    for (const part of this.game.snake.body) {
      if (part === this.game.snake.head) continue; // Skip the head
      if (
        this.game.snake.head.x - 1 === part.x &&
        this.game.snake.head.y === part.y
      )
        this.game.snake.moves.left = false;
      if (
        this.game.snake.head.x + 1 === part.x &&
        this.game.snake.head.y === part.y
      )
        this.game.snake.moves.right = false;
      if (
        this.game.snake.head.x === part.x &&
        this.game.snake.head.y + 1 === part.y
      )
        this.game.snake.moves.up = false;
      if (
        this.game.snake.head.x === part.x &&
        this.game.snake.head.y - 1 === part.y
      )
        this.game.snake.moves.down = false;
    }
  }
  others() {
    // Prevent hitting other snakes
    for (const other of this.game.board.snakes) {
      if (other === this.game.snake || other.id === this.game.snake.id)
        continue; // Skip own snake
      for (const part of other.body) {
        if (
          this.game.snake.head.x - 1 === part.x &&
          this.game.snake.head.y === part.y
        )
          this.game.snake.moves.left = false;
        if (
          this.game.snake.head.x + 1 === part.x &&
          this.game.snake.head.y === part.y
        )
          this.game.snake.moves.right = false;
        if (
          this.game.snake.head.x === part.x &&
          this.game.snake.head.y + 1 === part.y
        )
          this.game.snake.moves.up = false;
        if (
          this.game.snake.head.x === part.x &&
          this.game.snake.head.y - 1 === part.y
        )
          this.game.snake.moves.down = false;
      }
    }
  }
  isPositionSafe(position, exclude_tail = false) {
    // Check if a position would result in collision with walls, self, or others
    if (
      position.x < 0 ||
      position.x >= this.game.board.width ||
      position.y < 0 ||
      position.y >= this.game.board.height
    ) {
      return false; // Out of bounds
    }

    // Check against own body
    for (const [index, part] of this.game.snake.body.entries()) {
      const is_own_tail =
        index === this.game.snake.body.length - 1 && exclude_tail;
      if (!is_own_tail && position.x === part.x && position.y === part.y) {
        return false; // Collision with own body
      }
    }

    // Check against other snakes
    for (const other of this.game.board.snakes) {
      if (other.id === this.game.snake.id) continue;
      for (const part of other.body) {
        if (position.x === part.x && position.y === part.y) {
          return false; // Collision with other snake
        }
      }
    }

    // Check against hazards
    if (this.game.board.hazards) {
      for (const hazard of this.game.board.hazards) {
        if (position.x === hazard.x && position.y === hazard.y) {
          return false; // Collision with hazard
        }
      }
    }

    return true;
  }
}
