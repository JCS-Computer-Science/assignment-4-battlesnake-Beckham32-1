export default function score(snake) {
  snake.scores = {
    up: snake.moves.up ? (snake.scores?.up ?? 0) : -Infinity,
    down: snake.moves.down ? (snake.scores?.down ?? 0) : -Infinity,
    left: snake.moves.left ? (snake.scores?.left ?? 0) : -Infinity,
    right: snake.moves.right ? (snake.scores?.right ?? 0) : -Infinity,
  };
}
