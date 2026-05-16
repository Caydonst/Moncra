export function getSpawnPointsFromTiledMap(
  ex: any,
  tiledMap: any,
  layerName = "floor"
) {
  const spawnPoints: any[] = [];

  // Use your known map size for now
  let index = 0;

  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 30; x++) {
      const tileInfo = tiledMap.getTileByCoordinate(layerName, x, y);

      //if (!tileInfo?.tiledTile) continue;
      //if (tileInfo.exTile.solid) continue;

      if (tiledMap.layers[0].data[index] === 1) {
        spawnPoints.push(
            ex.vec(
                tileInfo.exTile.pos.x,
                tileInfo.exTile.pos.y
            )
        );
        console.log(tileInfo)
      }
      index++;

    }
  }

  return spawnPoints;
}