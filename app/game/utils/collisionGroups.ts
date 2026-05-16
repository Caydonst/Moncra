import {CollisionGroup} from "excalibur";

export async function createCollisionGroups() {
    const ex = await import("excalibur");

    const groupManager = ex.CollisionGroupManager;

    const PLAYER = 0b0001;
    const ENEMY = 0b0010;
    const WALL = 0b0100;
    const PROJECTILE = 0b1000;
    const ENEMY_PROJECTILE = 0b0010;

    const playerGroup = new ex.CollisionGroup(
        "player",
        PLAYER,
        WALL | ENEMY | ENEMY_PROJECTILE
    );

    const enemyGroup = new ex.CollisionGroup(
        "enemy",
        ENEMY,
        WALL | PROJECTILE | PLAYER
    );

    const wallGroup = new ex.CollisionGroup(
        "wall",
        WALL,
        ENEMY | PLAYER | PROJECTILE
    );

    const projectileGroup = new ex.CollisionGroup(
        "projectile",
        PROJECTILE,
        WALL | ENEMY
    );

    const enemyProjectileGroup = new ex.CollisionGroup(
        "enemy_projectile",
        ENEMY_PROJECTILE,
        PLAYER | WALL
    )
    console.log("enemy vs projectile", enemyGroup.canCollide(projectileGroup)); // true
    console.log("projectile vs player", projectileGroup.canCollide(playerGroup)); // false


    const playersCanCollideWith = ex.CollisionGroup.collidesWith([
        wallGroup, // collide with the floor
    ])
    const enemiesCanCollideWith = ex.CollisionGroup.collidesWith([
        wallGroup, // collide with the floor
        projectileGroup,
        playerGroup,
    ])
    const wallsCanCollideWith = ex.CollisionGroup.collidesWith([
        enemyGroup,
        playerGroup,
        projectileGroup,
    ])
    const projectilesCanCollideWith = ex.CollisionGroup.collidesWith([
        wallGroup,
        enemyGroup,
    ])

    console.log('enemiesCanCollideWith:', enemiesCanCollideWith.name); // ~(asteroid+player)
    console.log('projectilesCanCollideWith:', projectilesCanCollideWith.name); //~(asteroid+player)
    console.log('can collide?', playersCanCollideWith.canCollide(projectilesCanCollideWith)); // false


    const ProjectileCollisionGroup = new CollisionGroup("projectile", 0b0001, 0b1010);
    const EnemyCollisionGroup = new CollisionGroup("enemy", 0b010, 0b101);

    return {
        playersCanCollideWith,
        enemiesCanCollideWith,
        wallsCanCollideWith,
        projectilesCanCollideWith,
        playerGroup,
        enemyGroup,
        wallGroup,
        projectileGroup,
        ProjectileCollisionGroup,
        EnemyCollisionGroup,
        enemyProjectileGroup
    }
}