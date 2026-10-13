// Contest teams follow the ICPC format: the creator plus up to two teammates.
// Shared by the tRPC router and the team dialog so both enforce the same limit.
export const CONTEST_TEAM_MAX_SIZE = 3;
export const CONTEST_TEAM_MAX_TEAMMATES = CONTEST_TEAM_MAX_SIZE - 1;
