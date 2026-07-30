export type Hitbox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function areHitboxesOverlapping(
    first: Hitbox,
    second: Hitbox
): boolean {
    const firstLeft = first.x - first.width / 2;
    const firstRight = first.x + first.width / 2;
    const firstTop = first.y - first.height / 2;
    const firstBottom = first.y + first.height / 2;

    const secondLeft = second.x - second.width / 2;
    const secondRight = second.x + second.width / 2;
    const secondTop = second.y - second.height / 2;
    const secondBottom = second.y + second.height / 2;

    return (
        firstLeft < secondRight &&
        firstRight > secondLeft &&
        firstTop < secondBottom &&
        firstBottom > secondTop
    );
}