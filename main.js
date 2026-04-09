import { collision } from "./src/collision.js";
import flood from "./src/floodfill.js";
import { astar } from "./src/astar.js";
import attack from "./src/attack.js";

export default function move(gameState) {
  const snake = {
    game: gameState,
    head: gameState.you.head, // First item in body array
    body: gameState.you.body, // All following items after head and body
    health: gameState.you.health, // Snake health
    board: gameState.board, // Board ref
    moves: { left: true, right: true, up: true, down: true },
  };

  // Filter out simple collision
  collision.walls(snake);
  collision.self(snake);
  collision.others(snake);
  console.log(`Potential safe snake moves: ${snake.moves}`);

  // Run a floodfill check to evaluate positional scoring
  const grid = flood(snake);

  // Run A* towards nearest food to find best path
  astar.run(snake)

  // Run attack check and prediction algorithm
  attack(snake);

  // Score potential actions
  score(snake);

  // Determine the next move based on Floodfill, Astar, and Attack scoring
}
