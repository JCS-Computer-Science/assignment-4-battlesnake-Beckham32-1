import { collision } from "./src/collision.js";
import flood from "./src/floodfill.js";
import { astar } from "./src/astar.js";
import score from "./src/score.js";

export default function move(gameState) {
  const snake = {
    game: gameState,
    head: gameState.you.head,
    body: gameState.you.body,
    health: gameState.you.health,
    board: gameState.board,
    moves: { left: true, right: true, up: true, down: true },
    scores: { left: 0, right: 0, up: 0, down: 0 },
  };

  collision.walls(snake);
  collision.self(snake);
  collision.others(snake);
  console.log("Potential safe snake moves:", snake.moves);

  const grid = flood(snake); // floodfill the board to find the longest path in each direction, and avoid traps/dead ends
  console.log("Snake move scores after floodfill:", snake.scores);

  const astarFoodResults = astar.run(snake, gameState.board.food, grid); // use A* to find the shortest path to food, and increase the score of moves that get us closer to food
  console.log(
    `Snake move scores after A* to food: ${JSON.stringify(snake.scores)}, A* results: ${JSON.stringify(astarFoodResults)}`,
  );
  const astarSnakesResults = astar.run(snake, gameState.board.snakes, grid); // use A* to find the shortest path to other snakes, and increase the score of moves that get us closer to them, and decrease the score of moves that get us closer to their heads
  console.log(
    `Snake move scores after A* to snakes: ${JSON.stringify(snake.scores)}, A* results: ${JSON.stringify(astarSnakesResults)}`,
  );

  score(snake); // use the scores from the previous steps to find the best move, and return it

  const sorted = Object.entries(snake.scores).sort((a, b) => b[1] - a[1]);
  const best = sorted.find(([, value]) => value !== -Infinity);
  return { move: best ? best[0] : "up" }; // Return the move with the highest score, or "up" if all moves are unsafe
}
