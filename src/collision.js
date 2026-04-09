export const collision = {
  walls(snake) {
    snake.moves.left = snake.head.x <= 0; // Left is set to false if the evaluation fails
    snake.moves.right = snake.head.x >= snake.board.width - 1; // Right is set to false if the evaluation fails
    snake.moves.up = snake.head.y >= snake.board.height - 1; // Up is set to false if the evaluation fails
    snake.moves.down = snake.head.y <= 0; // Down is set to false if the evaluation fails
  },
  self(snake) {
    // Prevent snake turning 180deg
    snake.moves.left = snake.head.x <= snake.body[1].x; // Left is set to false if the evaluation fails
    snake.moves.right = snake.head.x >= snake.body[1].x; // Right is set to false if the evaluation fails
    snake.moves.up = snake.head.y >= snake.body[1].y; // Up is set to false if the evaluation fails
    snake.moves.down = snake.head.y <= snake.body[1].y; // Down is set to false if the evaluation fails

    // Prevent hitting own tail
    for (const part of snake.body) {
      if (part == snake.head) continue; // Part is the head
      snake.moves.left = snake.head.x <= part.x; // Left is set to false if the evaluation fails
      snake.moves.right = snake.head.x >= part.x; // Right is set to false if the evaluation fails
      snake.moves.up = snake.head.y >= part.y; // Up is set to false if the evaluation fails
      snake.moves.down = snake.head.y <= part.y; // Down is set to false if the evaluation fails
    }
  },
  others(snake) {
    for (const other of snake.board.snakes) {
      if (other === snake.game.you || other.id === snake.game.you.id) continue; // Skip my snake
      for (const part of other.body) {
        snake.moves.left = snake.head.x <= part.x; // Left is set to false if the evaluation fails
        snake.moves.right = snake.head.x >= part.x; // Right is set to false if the evaluation fails
        snake.moves.up = snake.head.y >= part.y; // Up is set to false if the evaluation fails
        snake.moves.down = snake.head.y <= part.y; // Down is set to false if the evaluation fails
      }
    }
  },
};
