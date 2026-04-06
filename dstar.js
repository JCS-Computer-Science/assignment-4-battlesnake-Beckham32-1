export const dstar = {
  /*
  while (!openList.isEmpty()) {
    point = openList.getFirst();
    expand(point);
  }
  */
  expand() {
    /*
    void expand(currentPoint) {
      boolean isRaise = isRaise(currentPoint);
      double cost;
      for each (neighbor in currentPoint.getNeighbors()) {
          if (isRaise) {
              if (neighbor.nextPoint == currentPoint) {
                  neighbor.setNextPointAndUpdateCost(currentPoint);
                  openList.add(neighbor);
              } else {
                  cost = neighbor.calculateCostVia(currentPoint);
                  if (cost < neighbor.getCost()) {
                      currentPoint.setMinimumCostToCurrentCost();
                      openList.add(currentPoint);
                  }
              }
          } else {
              cost = neighbor.calculateCostVia(currentPoint);
              if (cost < neighbor.getCost()) {
                  neighbor.setNextPointAndUpdateCost(currentPoint);
                  openList.add(neighbor);
              }
          }
      }
    }
    */
  },
  checkRaise() {
    /*
    boolean isRaise(point) {
      double cost;
      if (point.getCurrentCost() > point.getMinimumCost()) {
          for each(neighbor in point.getNeighbors()) {
              cost = point.calculateCostVia(neighbor);
              if (cost < point.getCurrentCost()) {
                  point.setNextPointAndUpdateCost(neighbor);
              }
          }
      }
      return point.getCurrentCost() > point.getMinimumCost();
    }
    */
  }
}