export default function move(gameState) {
  const snake = {
    move_safety: {
      up: true,
      down: true,
      left: true,
      right: true,
    },
    head: gameState.you.head, // First item in body array
    body: gameState.you.body[1], // Second item in body array
    tail: gameState.you.body.slice(2), // All following items after head and body
    length: gameState.you.body.length,
  };

  // Prevent snake from running into world border
  checkBounds(snake, gameState.board);
  // Prevent snake from colliding with itself
  checkSelf(snake);
  // Prevent snake from colliding with other snakes
  checkOthers(snake, gameState.board.snakes);

  // Filter out unsafe moves
  const safeMoves = Object.keys(snake.move_safety).filter(
    (direction) => snake.move_safety[direction],
  );

  console.log("HELLO");
  // Move towards food if it's safe to do so
  const nextMove = moveTowardsFood(snake, gameState.board.food[0]);
  const preferred = ["down", "left", "right", "up"];
  const finalMove =
    nextMove && safeMoves.includes(nextMove)
      ? nextMove
      : preferred.find((dir) => safeMoves.includes(dir)) || safeMoves[0];
  return { move: finalMove };
}

function checkBounds(snake, board) {
  snake.move_safety.left =
    snake.head.x - 1 < 0 ? false : snake.move_safety.left;
  snake.move_safety.right =
    snake.head.x + 1 >= board.width ? false : snake.move_safety.right;
  snake.move_safety.up = snake.head.y - 1 < 0 ? false : snake.move_safety.up;
  snake.move_safety.down =
    snake.head.y + 1 >= board.height ? false : snake.move_safety.down;
}

function checkSelf(snake) {
  // Prevent moving into neck
  if (snake.body.x === snake.head.x - 1 && snake.body.y === snake.head.y) {
    snake.move_safety.left = false;
  }
  if (snake.body.x === snake.head.x + 1 && snake.body.y === snake.head.y) {
    snake.move_safety.right = false;
  }
  if (snake.body.x === snake.head.x && snake.body.y === snake.head.y - 1) {
    snake.move_safety.up = false;
  }
  if (snake.body.x === snake.head.x && snake.body.y === snake.head.y + 1) {
    snake.move_safety.down = false;
  }

  // Prevent moving into tail parts
  for (const part of snake.tail) {
    if (part.x === snake.head.x - 1 && part.y === snake.head.y) {
      snake.move_safety.left = false;
    }
    if (part.x === snake.head.x + 1 && part.y === snake.head.y) {
      snake.move_safety.right = false;
    }
    if (part.x === snake.head.x && part.y === snake.head.y - 1) {
      snake.move_safety.up = false;
    }
    if (part.x === snake.head.x && part.y === snake.head.y + 1) {
      snake.move_safety.down = false;
    }
  }
}

function checkOthers(snake, other_snakes) {
  for (const other_snake of other_snakes) {
    for (const body_part of other_snake.body) {
      snake.move_safety.left =
        body_part.x === snake.head.x - 1 && body_part.y === snake.head.y
          ? false
          : snake.move_safety.left;
      snake.move_safety.right =
        body_part.x === snake.head.x + 1 && body_part.y === snake.head.y
          ? false
          : snake.move_safety.right;
      snake.move_safety.up =
        body_part.x === snake.head.x && body_part.y === snake.head.y - 1
          ? false
          : snake.move_safety.up;
      snake.move_safety.down =
        body_part.x === snake.head.x && body_part.y === snake.head.y + 1
          ? false
          : snake.move_safety.down;
    }
  }
}

function moveTowardsFood(snake, food) {
  if (!food) return;
  const dx = food.x - snake.head.x;
  const dy = food.y - snake.head.y;

  // Prefer the direction that reduces the larger distance first
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0 && snake.move_safety.left) {
      return "left";
    } else if (dx > 0 && snake.move_safety.right) {
      return "right";
    }
  }
  if (dy < 0 && snake.move_safety.up) {
    return "up";
  } else if (dy > 0 && snake.move_safety.down) {
    return "down";
  }
  if (dx < 0 && snake.move_safety.left) {
    return "left";
  } else if (dx > 0 && snake.move_safety.right) {
    return "right";
  }

  // If no preferred move, return undefined
  return undefined;
}
