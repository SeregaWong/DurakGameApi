
export function shuffle<T>(arr: T[]) {
    return arr.sort(() => .5 - Math.random());
}
