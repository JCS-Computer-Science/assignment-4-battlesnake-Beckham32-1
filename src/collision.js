export const collision = {
  walls(snake) {
    // Disable moves that go out of bounds
    if (snake.head.x - 1 < 0) snake.moves.left = false;
    if (snake.head.x + 1 >= snake.board.width) snake.moves.right = false;
    if (snake.head.y + 1 >= snake.board.height) snake.moves.up = false;
    if (snake.head.y - 1 < 0) snake.moves.down = false;
  },
  self(snake) {
    // Prevent snake turning 180deg into itself
    if (snake.body[1]) {
      if (snake.head.x - 1 === snake.body[1].x) snake.moves.left = false;
      if (snake.head.x + 1 === snake.body[1].x) snake.moves.right = false;
      if (snake.head.y + 1 === snake.body[1].y) snake.moves.up = false;
      if (snake.head.y - 1 === snake.body[1].y) snake.moves.down = false;
    }

    // Prevent hitting own body
    for (const part of snake.body) {
      if (part === snake.head) continue; // Skip the head
      if (snake.head.x - 1 === part.x && snake.head.y === part.y)
        snake.moves.left = false;
      if (snake.head.x + 1 === part.x && snake.head.y === part.y)
        snake.moves.right = false;
      if (snake.head.x === part.x && snake.head.y + 1 === part.y)
        snake.moves.up = false;
      if (snake.head.x === part.x && snake.head.y - 1 === part.y)
        snake.moves.down = false;
    }
  },
  others(snake) {
    // Prevent hitting other snakes
    for (const other of snake.board.snakes) {
      if (other === snake.game.you || other.id === snake.game.you.id) continue; // Skip own snake
      for (const part of other.body) {
        if (snake.head.x - 1 === part.x && snake.head.y === part.y)
          snake.moves.left = false;
        if (snake.head.x + 1 === part.x && snake.head.y === part.y)
          snake.moves.right = false;
        if (snake.head.x === part.x && snake.head.y + 1 === part.y)
          snake.moves.up = false;
        if (snake.head.x === part.x && snake.head.y - 1 === part.y)
          snake.moves.down = false;
      }
    }
  },
  isPositionSafe(position, snake, excludeOwnTail = false) {
    // Check if a position would result in collision with walls, self, or others
    if (
      position.x < 0 ||
      position.x >= snake.board.width ||
      position.y < 0 ||
      position.y >= snake.board.height
    ) {
      return false; // Out of bounds
    }

    // Check against own body
    for (const [index, part] of snake.body.entries()) {
      const isOwnTail = index === snake.body.length - 1 && excludeOwnTail;
      if (!isOwnTail && position.x === part.x && position.y === part.y) {
        return false; // Collision with own body
      }
    }

    // Check against other snakes
    for (const other of snake.board.snakes) {
      if (other.id === snake.game.you.id) continue;
      for (const part of other.body) {
        if (position.x === part.x && position.y === part.y) {
          return false; // Collision with other snake
        }
      }
    }

    // Check against hazards
    if (snake.board.hazards) {
      for (const hazard of snake.board.hazards) {
        if (position.x === hazard.x && position.y === hazard.y) {
          return false; // Collision with hazard
        }
      }
    }

    return true;
  },
  general(pos1, pos2) {
    // Check if two positions overlap (simple equality check)
    return pos1.x === pos2.x && pos1.y === pos2.y;
  },
};
