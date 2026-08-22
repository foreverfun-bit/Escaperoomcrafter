// Shared dependency-depth logic for puzzles: how many steps deep a puzzle
// sits in its room's "requires" chain. Used both to group the Flow page
// into layers and to sort/drag-reorder the Puzzles list to match.
export function computeDepths(puzzles) {
  const byId = new Map(puzzles.map((p) => [p.id, p]));
  const depthOf = new Map();

  function resolve(id, seen) {
    if (depthOf.has(id)) return depthOf.get(id);
    if (seen.has(id)) return 0; // dependency cycle guard
    seen.add(id);
    const puzzle = byId.get(id);
    const deps = (puzzle?.dependsOn || []).filter((depId) => byId.has(depId));
    const depth = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((depId) => resolve(depId, seen)));
    depthOf.set(id, depth);
    return depth;
  }

  puzzles.forEach((p) => resolve(p.id, new Set()));
  return depthOf;
}

export function computeLayers(puzzles) {
  const depthOf = computeDepths(puzzles);
  const maxLayer = puzzles.length ? Math.max(...puzzles.map((p) => depthOf.get(p.id) || 0)) : -1;
  const layers = Array.from({ length: maxLayer + 1 }, () => []);
  puzzles.forEach((p) => layers[depthOf.get(p.id) || 0].push(p));
  return layers;
}
