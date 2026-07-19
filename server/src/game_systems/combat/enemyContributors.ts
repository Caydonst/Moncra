const enemyContributors =
    new Map<string, Set<string>>();

export function addEnemyContributor(
    enemyId: string,
    sessionId: string
) {
    let contributors =
        enemyContributors.get(enemyId);

    if (!contributors) {
        contributors = new Set<string>();

        enemyContributors.set(
            enemyId,
            contributors
        );
    }

    contributors.add(sessionId);
}

export function getEnemyContributors(
    enemyId: string
) {
    return enemyContributors.get(enemyId);
}

export function clearEnemyContributors(
    enemyId: string
) {
    enemyContributors.delete(enemyId);
}