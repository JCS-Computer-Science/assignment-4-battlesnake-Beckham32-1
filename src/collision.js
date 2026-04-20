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
  general(x1, y1, x2, y2) {
    // AABB general collision for alternative usages
    if (x1 < x2 + 1 && x1 + 1 > x2 && y1 < y2 + 1 && y1 + 1 > y2) return true;
  },
};
