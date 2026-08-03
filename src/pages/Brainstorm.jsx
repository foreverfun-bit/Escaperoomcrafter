import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useRooms, useIdeas, useConnections, usePaths } from '../store/RoomsContext.jsx';
import { BOARD_SWATCHES } from '../store/constants.js';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import ToolRail from '../components/brainstorm/ToolRail.jsx';
import BoardCanvas from '../components/brainstorm/BoardCanvas.jsx';
import PropertiesPanel from '../components/brainstorm/PropertiesPanel.jsx';

const NOTE_LIKE_TOOLS = ['sticky', 'shape'];

export default function Brainstorm() {
  const { room } = useOutletContext();
  const { addIdea, updateIdea, deleteIdea, addConnection, deleteConnection, addPath, deletePath, convertIdeaToPuzzle } =
    useRooms();
  const ideas = useIdeas(room.id);
  const connections = useConnections(room.id);
  const paths = usePaths(room.id);

  const [tool, setTool] = useState('sticky');
  const [toolColor, setToolColor] = useState(BOARD_SWATCHES[0]);
  const [connectSource, setConnectSource] = useState('');
  const [selection, setSelection] = useState(null);
  const [quickIdea, setQuickIdea] = useState('');

  const handleToolChange = (nextTool) => {
    setTool(nextTool);
    setConnectSource('');
  };

  const handleCreateAt = (x, y) => {
    const partial = { x, y };
    if (NOTE_LIKE_TOOLS.includes(tool)) partial.color = toolColor;
    const id = addIdea(room.id, { boardType: tool, ...partial });
    setSelection({ type: 'idea', id });
  };

  const handleConnectClick = (ideaId) => {
    if (!connectSource) {
      setConnectSource(ideaId);
      return;
    }
    if (connectSource !== ideaId) addConnection(room.id, connectSource, ideaId);
    setConnectSource('');
    setTool('sticky');
  };

  const handleDeleteIdea = (id) => {
    if (selection?.type === 'idea' && selection.id === id) setSelection(null);
    deleteIdea(id);
  };

  const handleDeleteSelected = () => {
    if (!selection) return;
    if (selection.type === 'idea') handleDeleteIdea(selection.id);
    else if (selection.type === 'path') deletePath(selection.id);
    else if (selection.type === 'connection') deleteConnection(selection.id);
    setSelection(null);
  };

  const handleCaptureIdea = () => {
    const text = quickIdea.trim();
    if (!text) return;
    addIdea(room.id, {
      boardType: 'sticky',
      title: text.split(/\s+/).slice(0, 8).join(' '),
      notes: text,
      color: BOARD_SWATCHES[0],
    });
    setQuickIdea('');
  };

  const selectedIdea = selection?.type === 'idea' ? ideas.find((i) => i.id === selection.id) : null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-100">Brainstorm</h1>
          <p className="mt-1 text-sm text-stone-500">
            A freeform whiteboard for raw ideas — sticky notes, shapes, sketches, and connections.
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-stone-400">Quick capture</label>
              <textarea
                value={quickIdea}
                onChange={(e) => setQuickIdea(e.target.value)}
                placeholder="Write a quick thought, prop idea, story beat, or puzzle mechanic — it lands on the board as a sticky note."
                rows={2}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
              />
            </div>
            <Button onClick={handleCaptureIdea} className="shrink-0">
              <Lightbulb size={14} />
              Capture idea
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="font-medium text-stone-400">Note color</span>
        {BOARD_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setToolColor(color)}
            aria-label={`Use color ${color}`}
            className={`h-5 w-5 rounded-full border-2 ${toolColor === color ? 'border-pink-400' : 'border-stone-700'}`}
            style={{ background: color }}
          />
        ))}
        <span className="ml-2">
          {tool === 'connect'
            ? connectSource
              ? 'Click another object to draw a line.'
              : 'Click an object to start a connection.'
            : tool === 'draw'
              ? 'Drag on the canvas to draw.'
              : 'Double-click the canvas to place the selected tool.'}
        </span>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        <ToolRail tool={tool} onToolChange={handleToolChange} hasSelection={Boolean(selection)} onDeleteSelected={handleDeleteSelected} />
        <BoardCanvas
          ideas={ideas}
          connections={connections}
          paths={paths}
          tool={tool}
          connectSource={connectSource}
          selection={selection}
          onSelect={setSelection}
          onClearSelection={() => setSelection(null)}
          onCreateAt={handleCreateAt}
          onCommitMove={(id, x, y) => updateIdea(id, { x, y })}
          onCommitResize={(id, w, h) => updateIdea(id, { w, h })}
          onConnectClick={handleConnectClick}
          onFinishDraw={(points) => addPath(room.id, { points, color: '#2a2320', width: 3 })}
          onFieldChange={(id, field, value) => updateIdea(id, { [field]: value })}
          onToggleKeeper={(id) => {
            const idea = ideas.find((i) => i.id === id);
            if (idea) updateIdea(id, { keeper: !idea.keeper });
          }}
          onDeleteIdea={handleDeleteIdea}
        />
        <PropertiesPanel
          selection={selection}
          idea={selectedIdea}
          hasPath={selection?.type === 'path' && paths.some((p) => p.id === selection.id)}
          hasConnection={selection?.type === 'connection' && connections.some((c) => c.id === selection.id)}
          onColorChange={(color) => selectedIdea && updateIdea(selectedIdea.id, { color })}
          onShapeKindChange={(shapeKind) => selectedIdea && updateIdea(selectedIdea.id, { shapeKind })}
          onFontSizeChange={(delta) =>
            selectedIdea && updateIdea(selectedIdea.id, { fontSize: Math.min(48, Math.max(10, selectedIdea.fontSize + delta)) })
          }
          onConvert={() => selectedIdea && convertIdeaToPuzzle(selectedIdea.id)}
          onDelete={handleDeleteSelected}
        />
      </div>
    </div>
  );
}
