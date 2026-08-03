import { useOutletContext } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowDown, GitBranch } from 'lucide-react';
import { usePuzzles, useZones } from '../store/RoomsContext.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

function computeLayers(puzzles) {
  const byId = new Map(puzzles.map((p) => [p.id, p]));
  const layerOf = new Map();

  function depthOf(id, seen) {
    if (layerOf.has(id)) return layerOf.get(id);
    if (seen.has(id)) return 0; // dependency cycle guard
    seen.add(id);
    const puzzle = byId.get(id);
    const deps = (puzzle?.dependsOn || []).filter((depId) => byId.has(depId));
    const depth = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((depId) => depthOf(depId, seen)));
    layerOf.set(id, depth);
    return depth;
  }

  puzzles.forEach((p) => depthOf(p.id, new Set()));
  const maxLayer = puzzles.length ? Math.max(...puzzles.map((p) => layerOf.get(p.id) || 0)) : -1;
  const layers = Array.from({ length: maxLayer + 1 }, () => []);
  puzzles.forEach((p) => layers[layerOf.get(p.id) || 0].push(p));
  return layers;
}

export default function Flow() {
  const { room } = useOutletContext();
  const puzzles = usePuzzles(room.id);
  const zones = useZones(room.id);

  const layers = useMemo(() => computeLayers(puzzles), [puzzles]);
  const puzzleName = (id) => puzzles.find((p) => p.id === id)?.name || 'Unknown';
  const zoneName = (id) => zones.find((z) => z.id === id)?.name;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-stone-100">Flow</h1>
        <p className="mt-1 text-sm text-stone-500">
          Puzzles grouped by how many steps deep they sit in the dependency chain — what players unlock, in order.
        </p>
      </div>

      {puzzles.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No puzzles yet"
          description="Add puzzles and set what they depend on to see the player's path through the room."
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          {layers.map((layer, layerIndex) => (
            <div key={layerIndex} className="flex w-full flex-col items-center gap-2">
              <div className="flex w-full flex-wrap justify-center gap-3">
                {layer.map((puzzle) => (
                  <Card key={puzzle.id} className="w-72">
                    <CardBody>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-400/15 text-[11px] font-semibold text-pink-300">
                          {layerIndex + 1}
                        </span>
                        <h3 className="truncate font-semibold text-stone-100">{puzzle.name}</h3>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge>{puzzle.status}</Badge>
                        <span className="text-xs text-stone-500">{puzzle.type}</span>
                        {zoneName(puzzle.zoneId) && (
                          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-400">
                            {zoneName(puzzle.zoneId)}
                          </span>
                        )}
                      </div>
                      {puzzle.description && <p className="mt-2 text-xs text-stone-400">{puzzle.description}</p>}
                      {puzzle.dependsOn.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                          <span>Requires:</span>
                          {puzzle.dependsOn.map((id) => (
                            <span key={id} className="rounded-full bg-stone-800 px-2 py-0.5 text-stone-300">
                              {puzzleName(id)}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
              {layerIndex < layers.length - 1 && <ArrowDown size={18} className="text-stone-700" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
