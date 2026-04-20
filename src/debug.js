import flood from "./floodfill.js";
import { astar } from "./astar.js";

export default function debug(snake) {
  // Compute debug info
  const width = snake.board.width;
  const height = snake.board.height;
  const grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );

  // Mark blocked cells
  for (const other of snake.board.snakes) {
    for (const part of other.body) {
      grid[part.x][part.y] = 1;
    }
  }
  if (snake.board.hazards) {
    for (const hazard of snake.board.hazards) {
      grid[hazard.x][hazard.y] = 1;
    }
  }

  const blocked = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) {
        blocked.push({ x, y });
      }
    }
  }

  const food_targets = snake.board.food.map((food) => ({
    x: food.x,
    y: food.y,
  }));

  let min_dist = Infinity;
  let target = null;
  for (const food of food_targets) {
    const dist =
      Math.abs(food.x - snake.head.x) + Math.abs(food.y - snake.head.y);
    if (dist < min_dist) {
      min_dist = dist;
      target = food;
    }
  }

  let path = [];
  if (target) {
    path = astar.run(snake, [target], grid, {
      safeThreshold: 0.8,
      survival: false,
    });
  }

  const score_grid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => 0),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y] === 1) continue;

      const testHead = { x, y };
      const testBody = [testHead, ...snake.body];
      if (testBody.length > 1) testBody.pop();
      const testSnake = { ...snake, head: testHead, body: testBody };

      const testGrid = flood(testSnake);
      let testSpaceScore = 0;
      for (let tx = 0; tx < testGrid.length; tx++) {
        for (let ty = 0; ty < testGrid[0].length; ty++) {
          if (testGrid[tx][ty] === 2) testSpaceScore++;
        }
      }

      const willEat = food_targets.some((food) => food.x === x && food.y === y);
      const testTempBody = [{ x, y }, ...snake.body];
      if (!willEat) testTempBody.pop();

      const testAstarGrid = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => 0),
      );
      for (const other of snake.board.snakes) {
        if (other.id === snake.game.you.id) continue;
        for (const part of other.body) {
          testAstarGrid[part.x][part.y] = 1;
        }
      }
      for (const part of testTempBody) {
        testAstarGrid[part.x][part.y] = 1;
      }
      if (snake.board.hazards) {
        for (const hazard of snake.board.hazards) {
          testAstarGrid[hazard.x][hazard.y] = 1;
        }
      }

      const testFoodPath = astar.run(testSnake, food_targets, testAstarGrid, {
        safeThreshold: 0.8,
        longMode: astar.isLongMode(snake),
        survival: true,
      });

      let testFoodScore = 0;
      if (willEat) {
        testFoodScore = 1000;
      } else if (testFoodPath.length) {
        testFoodScore = -testFoodPath.length * 2;
      }

      const distToLeft = x;
      const distToRight = width - 1 - x;
      const distToBottom = y;
      const distToTop = height - 1 - y;
      const minDistToEdge = Math.min(
        distToLeft,
        distToRight,
        distToBottom,
        distToTop,
      );
      const edgePenalty = Math.max(0, 700 - minDistToEdge * 140);

      score_grid[x][y] = testSpaceScore * 5 + testFoodScore - edgePenalty;
    }
  }

  const safeFoodPath = astar.run(snake, food_targets, grid, {
    safeThreshold: 0.8,
    survival: false,
  });
  const effectivePath = astar.run(snake, food_targets, grid, {
    safeThreshold: 0.8,
    survival: true,
  });
  const pathType = safeFoodPath.length ? "safe-food" : "survival";
  if (pathType === "survival" && effectivePath.length) {
    target = effectivePath[effectivePath.length - 1];
  }

  let reachableCells = 0;
  let safeRatio = 0;
  if (effectivePath.length) {
    const end = effectivePath[effectivePath.length - 1];
    const willEat = food_targets.some(
      (food) => food.x === end.x && food.y === end.y,
    );
    const projected = astar.simulateProjectedGrid(
      snake,
      effectivePath,
      grid,
      willEat,
    );
    if (astar.inBounds(projected, end.x, end.y)) {
      projected[end.x][end.y] = 0;
    }
    reachableCells = astar.countReachableCells(projected, end.x, end.y);
    safeRatio = width * height > 0 ? reachableCells / (width * height) : 0;
  }

  return {
    blocked,
    target,
    scores: score_grid,
    path: effectivePath,
    pathType,
    longMode: astar.isLongMode(snake),
    reachableCells,
    totalCells: width * height,
    safeRatio,
  };
}
