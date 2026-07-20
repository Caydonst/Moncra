const enemyContributors = new Map();
export function addEnemyContributor(enemyId, sessionId) {
    let contributors = enemyContributors.get(enemyId);
    if (!contributors) {
        contributors = new Set();
        enemyContributors.set(enemyId, contributors);
    }
    contributors.add(sessionId);
}
export function getEnemyContributors(enemyId) {
    return enemyContributors.get(enemyId);
}
export function clearEnemyContributors(enemyId) {
    enemyContributors.delete(enemyId);
}
//# sourceMappingURL=enemyContributors.js.map