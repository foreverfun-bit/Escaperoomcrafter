import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Lightbulb, ArrowRight, Music, DollarSign } from 'lucide-react';
import { fetchSharedRoom } from '../store/publicRead.js';
import { computeDepths } from '../store/puzzleFlow.js';
import { TASK_STATUSES } from '../store/constants.js';
import Badge from '../components/ui/Badge.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import Lightbox from '../components/ui/Lightbox.jsx';

// Read-only view for a room's public share link - no login, no editing.
// Deliberately its own simple page rather than reusing the authenticated
// app's per-tab pages: those are wired throughout for CRUD (RoomsContext,
// Firebase Storage uploads, drag handlers), and keeping the public surface
// to one page that only ever reads keeps what a stranger can do down to
// exactly "look at this room."
export default function SharedRoom() {
  const { roomId } = useParams();
  const [data, setData] = useState(undefined); // undefined = loading, null = not found/not shared
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSharedRoom(roomId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error('Unexpected error loading shared room', err);
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (data === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 size={22} className="animate-spin text-stone-600" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-center">
        <div>
          <h1 className="text-lg font-semibold text-stone-100">Room not available</h1>
          <p className="mt-2 text-sm text-stone-500">
            This link isn't shared (or doesn't exist). Ask the room's owner to turn sharing on.
          </p>
        </div>
      </div>
    );
  }

  const { room, zones, puzzles, props, tasks, interiorPaths } = data;
  const zoneName = (id) => zones.find((z) => z.id === id)?.name;
  const puzzleName = (id) => puzzles.find((p) => p.id === id)?.name || 'Unknown';
  const propsForPuzzle = (puzzleId) => props.filter((p) => (p.puzzleIds || []).includes(puzzleId));
  const itemsInZone = (zoneId) => props.filter((p) => p.zoneId === zoneId && p.x != null);
  const pathsInZone = (zoneId) => interiorPaths.filter((p) => p.zoneId === zoneId);

  const depthOf = computeDepths(puzzles);
  const orderedPuzzles = [...puzzles].sort((a, b) => (depthOf.get(a.id) || 0) - (depthOf.get(b.id) || 0));
  const totalCost = props.reduce((sum, p) => sum + (p.cost || 0) * (p.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-stone-950 pb-16">
      <div className="border-b border-stone-800 bg-stone-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm font-semibold text-stone-100">Escape Room Crafter</span>
          <span className="rounded-full bg-stone-800 px-2.5 py-1 text-[11px] font-medium text-stone-400">
            View-only shared link
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-stone-100">{room.name}</h1>
              <Badge>{room.status}</Badge>
            </div>
            {room.theme && <p className="mt-1 text-sm text-stone-400">{room.theme}</p>}
            {room.description && <p className="mt-3 whitespace-pre-wrap text-sm text-stone-400">{room.description}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
              <span>Difficulty: {room.difficulty}</span>
              <span>Target duration: {room.targetMinutes} min</span>
              <span className="inline-flex items-center gap-1">
                <DollarSign size={12} />
                Prop budget: ${totalCost.toFixed(2)}
              </span>
            </div>
          </CardBody>
        </Card>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-200">
            Puzzles & clues <span className="font-normal text-stone-500">({puzzles.length})</span>
          </h2>
          <div className="space-y-3">
            {orderedPuzzles.map((p) => {
              const unlocks = puzzles.filter((other) => other.dependsOn?.includes(p.id));
              const linkedProps = propsForPuzzle(p.id);
              return (
                <Card key={p.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-stone-100">{p.name}</h3>
                      <Badge>{p.status}</Badge>
                      <span className="text-xs text-stone-500">{p.type}</span>
                      {zoneName(p.zoneId) && (
                        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-400">
                          {zoneName(p.zoneId)}
                        </span>
                      )}
                      {linkedProps.map((pr) => (
                        <span key={pr.id} className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-400">
                          📦 {pr.name}
                        </span>
                      ))}
                    </div>
                    {p.description && <p className="mt-1.5 text-sm text-stone-400">{p.description}</p>}
                    {p.photos?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.photos.map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.dataUrl}
                            alt=""
                            onClick={() => setLightbox(photo.dataUrl)}
                            className="h-12 w-12 cursor-pointer rounded-md border border-stone-800 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    {p.solution && (
                      <p className="mt-2 text-sm text-stone-300">
                        <span className="text-stone-500">Solution: </span>
                        {p.solution}
                      </p>
                    )}
                    {(p.dependsOn || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                        <span>Requires:</span>
                        {p.dependsOn.map((id) => (
                          <span key={id} className="rounded-full bg-stone-800 px-2 py-0.5 text-stone-300">
                            {puzzleName(id)}
                          </span>
                        ))}
                      </div>
                    )}
                    {unlocks.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                        <ArrowRight size={12} />
                        <span>Unlocks:</span>
                        {unlocks.map((u) => (
                          <span key={u.id} className="rounded-full bg-pink-400/10 px-2 py-0.5 text-pink-200">
                            {u.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.hints?.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <Lightbulb size={12} />
                          Hints
                        </div>
                        <ol className="list-inside list-decimal space-y-0.5 pl-1 text-stone-400">
                          {p.hints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {p.audioClips?.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {p.audioClips.map((clip) => (
                          <div key={clip.id} className="flex items-center gap-1.5">
                            <Music size={12} className="shrink-0 text-stone-500" />
                            <audio controls src={clip.url} className="h-7 max-w-xs" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>

        {zones.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-stone-200">Room layout</h2>
            <div className="space-y-4">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardBody>
                    <h3 className="font-semibold text-stone-100">
                      {zone.name}
                      {zone.widthFt && zone.lengthFt ? (
                        <span className="ml-2 text-xs font-normal text-stone-500">
                          {zone.widthFt}' × {zone.lengthFt}'
                        </span>
                      ) : null}
                    </h3>
                    <div
                      className="relative mt-3 w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-950"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {pathsInZone(zone.id).map((path) => (
                          <polyline
                            key={path.id}
                            points={path.points}
                            fill="none"
                            stroke={path.color}
                            strokeWidth={path.width}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                      </svg>
                      {itemsInZone(zone.id).map((item) => (
                        <div
                          key={item.id}
                          className="absolute overflow-hidden rounded-md border-2 border-black/30 p-1.5 text-white shadow-lg"
                          style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            width: `${item.w}%`,
                            height: `${item.h}%`,
                            background: item.photos?.[0] ? undefined : '#57534e',
                            backgroundImage: item.photos?.[0] ? `url(${item.photos[0].dataUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {item.photos?.[0] && (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />
                          )}
                          <p className="relative truncate text-[11px] font-bold leading-tight">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-200">
            Props & inventory <span className="font-normal text-stone-500">({props.length})</span>
          </h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-800 text-xs text-stone-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {props.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.photos?.[0] && (
                            <img
                              src={p.photos[0].dataUrl}
                              alt=""
                              onClick={() => setLightbox(p.photos[0].dataUrl)}
                              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-stone-800 object-cover"
                            />
                          )}
                          <span className="font-medium text-stone-100">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-400">{p.category}</td>
                      <td className="px-4 py-3 text-stone-400">{p.quantity}</td>
                      <td className="px-4 py-3">
                        <Badge>{p.sourcingStatus}</Badge>
                      </td>
                      <td className="px-4 py-3 text-stone-400">${((p.cost || 0) * (p.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {tasks.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-stone-200">Build tasks</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {TASK_STATUSES.map((status) => (
                <div key={status}>
                  <h3 className="mb-2 text-xs font-semibold text-stone-400">{status}</h3>
                  <div className="space-y-2">
                    {tasks
                      .filter((t) => t.status === status)
                      .map((t) => (
                        <Card key={t.id}>
                          <CardBody>
                            <p className="text-sm font-medium text-stone-100">{t.title}</p>
                            {t.description && <p className="mt-1 text-xs text-stone-500">{t.description}</p>}
                          </CardBody>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
