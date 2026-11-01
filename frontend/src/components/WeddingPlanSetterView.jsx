import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Maximize2, Minimize2, Copy, Clipboard, Trash2, RotateCw, 
  Download, FileText, Move, Square, Minus, Type, Grid, 
  Layers, Check, RefreshCw, ZoomIn, ZoomOut, AlertCircle, 
  Settings2, Eye, Compass, Undo, Redo, Printer, Sparkles, X, Plus
} from 'lucide-react';

// Default Luxury Palette Assets
const PLANNER_ASSETS = [
  {
    id: 'stage',
    name: 'Royal Stage / Mandap',
    type: 'image',
    src: '/stage.png',
    defaultWidth: 200,
    defaultHeight: 125,
    category: 'Stage Architecture',
    description: 'Concert & Wedding Mandap Stage'
  },
  {
    id: 'dinning_table',
    name: 'Banquet Dining Table (6 Chairs)',
    type: 'image',
    src: '/dinning_table.png',
    defaultWidth: 140,
    defaultHeight: 90,
    category: 'Dining & Banqueting',
    description: 'Top-down banquet table with 6 chairs'
  },
  {
    id: 'chair',
    name: 'Banquet Chair',
    type: 'image',
    src: '/chair.webp',
    defaultWidth: 44,
    defaultHeight: 44,
    category: 'Seating & Chairs',
    description: 'Single guest wooden banquet chair'
  },
  {
    id: 'buffet',
    name: 'Royal Buffet Station',
    type: 'image',
    src: '/buffet.png',
    defaultWidth: 160,
    defaultHeight: 80,
    category: 'Buffet & Catering',
    description: 'Food & catering service counter'
  },
  {
    id: 'car',
    name: 'Valet Car / Parking Slot',
    type: 'image',
    src: '/car.png',
    defaultWidth: 50,
    defaultHeight: 105,
    category: 'Parking & Concierge',
    description: 'Top-down vehicle slot for guest & valet parking'
  },
  {
    id: 'door',
    name: 'Grand Entrance & Exit Door',
    type: 'image',
    src: '/door.png',
    defaultWidth: 80,
    defaultHeight: 80,
    category: 'Gates & Architecture',
    description: 'Double wooden venue entrance / ceremonial gateway'
  }
];

const HALL_PRESETS = [
  { name: 'Grand Palace Ballroom', length: 120, breadth: 80, unit: 'ft', desc: '9,600 sq.ft • Cap: 500 Guests' },
  { name: 'Royal Heritage Lawn', length: 150, breadth: 100, unit: 'ft', desc: '15,000 sq.ft • Cap: 800 Guests' },
  { name: 'Mewar Courtyard', length: 90, breadth: 60, unit: 'ft', desc: '5,400 sq.ft • Cap: 300 Guests' },
  { name: 'Intimate Banquet Hall', length: 60, breadth: 40, unit: 'ft', desc: '2,400 sq.ft • Cap: 150 Guests' }
];

// 8-Axis Perimeter Handles + Top Rotation Stem & Handle (Matching User Reference Image)
function TransformerHandles({ element, isRotating, onResizeMouseDown, onRotateMouseDown }) {
  const handles = [
    { id: 'nw', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
    { id: 'n',  cursor: 'ns-resize',   style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { id: 'ne', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
    { id: 'e',  cursor: 'ew-resize',   style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { id: 'se', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
    { id: 's',  cursor: 'ns-resize',   style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { id: 'sw', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
    { id: 'w',  cursor: 'ew-resize',   style: { top: '50%', left: -5, transform: 'translateY(-50%)' } }
  ];

  return (
    <>
      {/* 8 Perimeter Axis Points (All 4 Corners + 4 Side Midpoints) */}
      {handles.map(({ id, cursor, style }) => (
        <div
          key={id}
          onMouseDown={(e) => onResizeMouseDown(e, id, element)}
          title={`Resize from ${id.toUpperCase()}`}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1.5px solid #334155',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            cursor,
            zIndex: 35,
            boxSizing: 'border-box',
            ...style
          }}
        />
      ))}

      {/* Vertical Stem Line from Top Middle Handle */}
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: '50%',
          width: 1.5,
          height: 18,
          background: '#475569',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 34
        }}
      />

      {/* Top Circular Rotation Handle with Arrow Icon */}
      <div
        onMouseDown={(e) => onRotateMouseDown(e, element)}
        title="Click & drag to rotate (0° - 360°)"
        style={{
          position: 'absolute',
          top: -44,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#ffffff',
          border: '1.5px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isRotating ? 'grabbing' : 'grab',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          zIndex: 36,
          transition: 'box-shadow 0.15s ease'
        }}
      >
        <RotateCw size={12} color="#334155" strokeWidth={2.4} />
      </div>

      {/* Floating Rotation Degree Indicator */}
      {isRotating && (
        <div
          style={{
            position: 'absolute',
            top: -70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 40,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {element.rotation || 0}°
        </div>
      )}
    </>
  );
}

export default function WeddingPlanSetterView() {
  // Hall Dimensions State
  const [hallLength, setHallLength] = useState(120);
  const [hallBreadth, setHallBreadth] = useState(80);
  const [hallUnit, setHallUnit] = useState('ft'); // 'ft' | 'm'
  const [dimModalOpen, setDimModalOpen] = useState(false);
  const [tempLength, setTempLength] = useState(120);
  const [tempBreadth, setTempBreadth] = useState(80);
  const [tempUnit, setTempUnit] = useState('ft');

  // Canvas Objects & Interaction State
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'rectangle' | 'line' | 'text'
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [clipboard, setClipboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Live Drawing State (Rectangle / Line)
  const [drawingStart, setDrawingStart] = useState(null);
  const [drawingCurrent, setDrawingCurrent] = useState(null);

  // Interaction Dragging / Resizing / Rotating
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  const [dragInitial, setDragInitial] = useState(null);
  const [resizeInitial, setResizeInitial] = useState(null);
  const [rotationInitial, setRotationInitial] = useState(null);

  // Notification / Feedback Banner
  const [feedback, setFeedback] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Canvas Reference
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate dynamic canvas dimensions based on hall aspect ratio
  const maxCanvasWidth = 960;
  const maxCanvasHeight = 620;
  const aspectRatio = (hallLength || 120) / (hallBreadth || 80);
  
  let canvasWidth = maxCanvasWidth;
  let canvasHeight = maxCanvasWidth / aspectRatio;
  if (canvasHeight > maxCanvasHeight) {
    canvasHeight = maxCanvasHeight;
    canvasWidth = maxCanvasHeight * aspectRatio;
  }

  // Pixels per real-world unit
  const pxPerUnit = canvasWidth / (hallLength || 120);

  // Push to history
  const pushHistory = useCallback((newElements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, JSON.parse(JSON.stringify(newElements))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1];
      setElements(JSON.parse(JSON.stringify(prevElements)));
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1];
      setElements(JSON.parse(JSON.stringify(nextElements)));
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
    }
  };

  // Initialize completely plain canvas initially (no default line or elements)
  useEffect(() => {
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);


  const selectedElement = elements.find(el => el.id === selectedId);

  // Snap to 10px grid
  const snap = (val) => {
    if (!snapToGrid) return val;
    return Math.round(val / 10) * 10;
  };

  // Add Element from Palette
  const addAssetToCanvas = (asset, dropX = null, dropY = null) => {
    const x = dropX !== null ? snap(dropX - asset.defaultWidth / 2) : snap(canvasWidth / 2 - asset.defaultWidth / 2);
    const y = dropY !== null ? snap(dropY - asset.defaultHeight / 2) : snap(canvasHeight / 2 - asset.defaultHeight / 2);

    const newObj = {
      id: `${asset.id}_${Date.now()}`,
      type: 'image',
      src: asset.src,
      name: asset.name,
      x: Math.max(10, Math.min(canvasWidth - asset.defaultWidth - 10, x)),
      y: Math.max(10, Math.min(canvasHeight - asset.defaultHeight - 10, y)),
      width: asset.defaultWidth,
      height: asset.defaultHeight,
      rotation: 0,
      label: asset.name
    };

    const updated = [...elements, newObj];
    setElements(updated);
    setSelectedId(newObj.id);
    pushHistory(updated);
    setFeedback(`Added '${asset.name}' to floor plan.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // HTML5 Drag and Drop handlers from palette
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    try {
      const assetData = JSON.parse(dataStr);
      const rect = containerRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      addAssetToCanvas(assetData, dropX, dropY);
    } catch (err) {
      console.warn("Drop parse error", err);
    }
  };

  // Canvas Mouse Down: Select, Start Draw Rectangle, Start Draw Line, or Text
  const handleCanvasMouseDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    if (activeTool === 'rectangle') {
      setDrawingStart({ x, y });
      setDrawingCurrent({ x, y });
      return;
    }

    if (activeTool === 'line') {
      setDrawingStart({ x, y });
      setDrawingCurrent({ x, y });
      return;
    }

    if (activeTool === 'text') {
      const newText = {
        id: `text_${Date.now()}`,
        type: 'text',
        x,
        y,
        text: 'Type Annotation Note...',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        hasBackground: true
      };
      const updated = [...elements, newText];
      setElements(updated);
      setSelectedId(newText.id);
      pushHistory(updated);
      setActiveTool('select');
      setFeedback("Text note placed! Edit the wording or font size in the toolbar.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    // If clicking on empty canvas, deselect
    if (e.target === containerRef.current || e.target.tagName === 'svg') {
      setSelectedId(null);
    }
  };

  // Mouse Move during drawing or dragging
  const handleCanvasMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    if (drawingStart) {
      setDrawingCurrent({ x, y });
      return;
    }

    if (isDragging && selectedId && dragInitial) {
      const dx = e.clientX - dragInitial.startX;
      const dy = e.clientY - dragInitial.startY;

      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'line') {
          return {
            ...el,
            x1: snap(dragInitial.x1 + dx),
            y1: snap(dragInitial.y1 + dy),
            x2: snap(dragInitial.x2 + dx),
            y2: snap(dragInitial.y2 + dy)
          };
        }
        const w = el.width || 40;
        const h = el.height || 40;
        const targetX = snap(dragInitial.elX + dx);
        const targetY = snap(dragInitial.elY + dy);
        return {
          ...el,
          x: Math.max(0, Math.min(canvasWidth - w, targetX)),
          y: Math.max(0, Math.min(canvasHeight - h, targetY))
        };
      }));
      return;
    }

    if (isRotating && selectedId && rotationInitial) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const rad = Math.atan2(mouseY - rotationInitial.cy, mouseX - rotationInitial.cx);
      let deg = Math.round(rad * (180 / Math.PI) + 90);
      if (deg < 0) deg += 360;
      deg = deg % 360;

      // Smart snap to 45 degree intervals if within 3 degrees
      if (Math.abs(deg % 45) < 3 || Math.abs(deg % 45) > 42) {
        deg = Math.round(deg / 45) * 45;
      }
      deg = ((deg % 360) + 360) % 360;

      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        return { ...el, rotation: deg };
      }));
      return;
    }

    if (isResizing && selectedId && resizeInitial) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        const dx = x - resizeInitial.startX;
        const dy = y - resizeInitial.startY;
        let newW = resizeInitial.width;
        let newH = resizeInitial.height;
        let newX = resizeInitial.x;
        let newY = resizeInitial.y;

        // 8-Axis Resizing: 4 Corners + 4 Side Centers
        if (resizeHandle === 'se') {
          newW = Math.max(20, resizeInitial.width + dx);
          newH = Math.max(20, resizeInitial.height + dy);
        } else if (resizeHandle === 'e') {
          newW = Math.max(20, resizeInitial.width + dx);
        } else if (resizeHandle === 'ne') {
          newW = Math.max(20, resizeInitial.width + dx);
          newH = Math.max(20, resizeInitial.height - dy);
          newY = resizeInitial.y + dy;
        } else if (resizeHandle === 'n') {
          newH = Math.max(20, resizeInitial.height - dy);
          newY = resizeInitial.y + dy;
        } else if (resizeHandle === 'nw') {
          newW = Math.max(20, resizeInitial.width - dx);
          newH = Math.max(20, resizeInitial.height - dy);
          newX = resizeInitial.x + dx;
          newY = resizeInitial.y + dy;
        } else if (resizeHandle === 'w') {
          newW = Math.max(20, resizeInitial.width - dx);
          newX = resizeInitial.x + dx;
        } else if (resizeHandle === 'sw') {
          newW = Math.max(20, resizeInitial.width - dx);
          newH = Math.max(20, resizeInitial.height + dy);
          newX = resizeInitial.x + dx;
        } else if (resizeHandle === 's') {
          newH = Math.max(20, resizeInitial.height + dy);
        }

        return { ...el, x: snap(newX), y: snap(newY), width: snap(newW), height: snap(newH) };
      }));
    }
  };

  // Mouse Up: Commit drawn shape or end drag/resize/rotate
  const handleCanvasMouseUp = () => {
    if (drawingStart && drawingCurrent) {
      if (activeTool === 'rectangle') {
        const x = Math.min(drawingStart.x, drawingCurrent.x);
        const y = Math.min(drawingStart.y, drawingCurrent.y);
        const width = Math.max(40, Math.abs(drawingCurrent.x - drawingStart.x));
        const height = Math.max(30, Math.abs(drawingCurrent.y - drawingStart.y));

        const newRect = {
          id: `rect_${Date.now()}`,
          type: 'rectangle',
          x,
          y,
          width,
          height,
          fillColor: 'rgba(254, 243, 199, 0.45)', // luxury amber
          borderColor: '#d97706',
          borderStyle: 'dashed',
          borderWidth: 2,
          label: 'Custom Wedding Zone / Lounge'
        };

        const updated = [...elements, newRect];
        setElements(updated);
        setSelectedId(newRect.id);
        pushHistory(updated);
        setFeedback("Rectangle zone created! Edit fill or label in the toolbar.");
        setTimeout(() => setFeedback(null), 3000);
      } else if (activeTool === 'line') {
        const newLine = {
          id: `line_${Date.now()}`,
          type: 'line',
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: drawingCurrent.x,
          y2: drawingCurrent.y,
          style: 'dashed',
          color: '#d97706',
          strokeWidth: 4,
          label: 'Dining & Hall Separation Partition'
        };

        const updated = [...elements, newLine];
        setElements(updated);
        setSelectedId(newLine.id);
        pushHistory(updated);
        setFeedback("Separation partition line created!");
        setTimeout(() => setFeedback(null), 3000);
      }

      setDrawingStart(null);
      setDrawingCurrent(null);
      setActiveTool('select');
      return;
    }

    if (isDragging || isResizing || isRotating) {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
      setResizeInitial(null);
      setRotationInitial(null);
      setDragInitial(null);
      pushHistory(elements);
    }
  };

  // Window-level mousemove & mouseup to guarantee smooth tracking even outside canvas bounds
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating && !drawingStart) return;

    const handleWindowMouseMove = (e) => {
      handleCanvasMouseMove(e);
    };

    const handleWindowMouseUp = () => {
      handleCanvasMouseUp();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  });

  // Start dragging an existing element
  const handleElementMouseDown = (e, el) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsDragging(true);
    setDragInitial({
      startX: e.clientX,
      startY: e.clientY,
      elX: el.x || 0,
      elY: el.y || 0,
      x1: el.x1,
      y1: el.y1,
      x2: el.x2,
      y2: el.y2
    });
  };

  // Start 8-axis resizing
  const handleResizeHandleMouseDown = (e, handle, el) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    const rect = containerRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
    setResizeInitial({
      startX: x,
      startY: y,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height
    });
  };

  // Start freehand rotation dragging
  const handleRotateHandleMouseDown = (e, el) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsRotating(true);
    const rect = containerRef.current.getBoundingClientRect();
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    setRotationInitial({
      cx,
      cy,
      startAngle: (el.rotation || 0)
    });
  };

  // Minimise / Maximise Scaling
  const handleScaleElement = (factor) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId) return el;
      if (el.type === 'text') {
        const newSize = Math.max(10, Math.min(48, Math.round(el.fontSize * factor)));
        return { ...el, fontSize: newSize };
      }
      if (el.type === 'line') {
        return el;
      }
      const newW = snap(Math.max(20, Math.round(el.width * factor)));
      const newH = snap(Math.max(20, Math.round(el.height * factor)));
      return { ...el, width: newW, height: newH };
    }));
    pushHistory(elements);
  };

  // Rotate Element
  const handleRotateElement = (deg = 45) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId) return el;
      return { ...el, rotation: ((el.rotation || 0) + deg) % 360 };
    }));
    pushHistory(elements);
  };

  // Change Font Size Alone for Text
  const handleFontSizeChange = (newSize) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId || el.type !== 'text') return el;
      return { ...el, fontSize: parseInt(newSize, 10) || 16 };
    }));
    pushHistory(elements);
  };

  // Change Element Label / Text
  const handleLabelChange = (newVal) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId) return el;
      if (el.type === 'text') return { ...el, text: newVal };
      return { ...el, label: newVal };
    }));
  };

  // Change Rectangle Fill Color
  const handleFillColorChange = (color) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedId || el.type !== 'rectangle') return el;
      return { ...el, fillColor: color };
    }));
    pushHistory(elements);
  };

  // Copy & Paste Multiple Times
  const handleCopy = () => {
    if (!selectedElement) return;
    setClipboard(JSON.parse(JSON.stringify(selectedElement)));
    setFeedback(`Copied '${selectedElement.name || selectedElement.label || selectedElement.type}' to clipboard.`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const newId = `${clipboard.type}_${Date.now()}`;
    const offset = 25;
    let pastedObj = {
      ...clipboard,
      id: newId,
      x: snap((clipboard.x || 50) + offset),
      y: snap((clipboard.y || 50) + offset)
    };

    if (clipboard.type === 'line') {
      pastedObj.x1 = clipboard.x1 + offset;
      pastedObj.y1 = clipboard.y1 + offset;
      pastedObj.x2 = clipboard.x2 + offset;
      pastedObj.y2 = clipboard.y2 + offset;
    }

    const updated = [...elements, pastedObj];
    setElements(updated);
    setSelectedId(newId);
    pushHistory(updated);
    setFeedback(`Pasted identical copy. You can paste multiple times (Ctrl+V).`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Batch Clone Row of 5 (For Chairs or Dining Tables)
  const handleCloneRow = (count = 5) => {
    if (!selectedElement) return;
    const clones = [];
    const spacing = (selectedElement.width || 40) + 15;

    for (let i = 1; i <= count; i++) {
      const newX = snap(selectedElement.x + i * spacing);
      if (newX + (selectedElement.width || 40) > canvasWidth) break;
      clones.push({
        ...selectedElement,
        id: `${selectedElement.type}_batch_${Date.now()}_${i}`,
        x: newX,
        y: selectedElement.y
      });
    }

    if (clones.length > 0) {
      const updated = [...elements, ...clones];
      setElements(updated);
      pushHistory(updated);
      setFeedback(`Cloned row of ${clones.length} identical items!`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Delete Element
  const handleDelete = () => {
    if (!selectedId) return;
    const updated = elements.filter(el => el.id !== selectedId);
    setElements(updated);
    setSelectedId(null);
    pushHistory(updated);
    setFeedback("Element removed.");
    setTimeout(() => setFeedback(null), 2000);
  };

  // Keyboard Shortcuts: Ctrl+C, Ctrl+V, Delete, Ctrl+Z, Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleCopy();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, clipboard, elements, historyIndex]);

  // Apply Dimension Changes
  const handleApplyDimensions = (e) => {
    e.preventDefault();
    setHallLength(tempLength);
    setHallBreadth(tempBreadth);
    setHallUnit(tempUnit);
    setDimModalOpen(false);
    setFeedback(`Hall reconfigured to ${tempLength} × ${tempBreadth} ${tempUnit} (${tempLength * tempBreadth} sq.${tempUnit}).`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Pre-load preset layout
  const handleLoadPreset = (preset) => {
    setHallLength(preset.length);
    setHallBreadth(preset.breadth);
    setHallUnit(preset.unit);
    setTempLength(preset.length);
    setTempBreadth(preset.breadth);
    setTempUnit(preset.unit);
    setFeedback(`Loaded ${preset.name} (${preset.length} × ${preset.breadth} ${preset.unit}).`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // EXPORT TO PNG (High Resolution 300 DPI Canvas Synthesis)
  const handleExportPNG = async () => {
    try {
      setExporting(true);
      const offscreen = document.createElement('canvas');
      const scaleFactor = 2; // High resolution retina 2x
      offscreen.width = canvasWidth * scaleFactor;
      offscreen.height = (canvasHeight + 110) * scaleFactor; // extra space for client header
      const ctx = offscreen.getContext('2d');
      ctx.scale(scaleFactor, scaleFactor);

      // 1. Background Paper Fill
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight + 110);

      // 2. Client Header Block
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px Roboto, sans-serif';
      ctx.fillText("KNOTCORE LUXURY WEDDING ERP — VENUE & SEATING ARCHITECTURE", 24, 34);

      ctx.font = '12px Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Hall Ground Dimensions: ${hallLength} ${hallUnit} (Length) × ${hallBreadth} ${hallUnit} (Breadth) • Area: ${(hallLength * hallBreadth).toLocaleString()} sq.${hallUnit} • Scale: 1 Grid = 10 ${hallUnit}`, 24, 56);
      ctx.fillText(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} • Status: Verified for Client Presentation`, 24, 74);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 88);
      ctx.lineTo(canvasWidth - 20, 88);
      ctx.stroke();

      const offsetY = 95;

      // 3. Draw Hall Ground & Architectural Grid
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(10, offsetY + 10, canvasWidth - 20, canvasHeight - 20);

      // Grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 10; x <= canvasWidth - 10; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, offsetY + 10);
        ctx.lineTo(x, offsetY + canvasHeight - 10);
        ctx.stroke();
      }
      for (let y = offsetY + 10; y <= offsetY + canvasHeight - 10; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(canvasWidth - 10, y);
        ctx.stroke();
      }

      // Outer Hall Walls
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, offsetY + 10, canvasWidth - 20, canvasHeight - 20);

      // Dimension labels on borders
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`◄——— HALL LENGTH: ${hallLength} ${hallUnit.toUpperCase()} ———►`, canvasWidth / 2, offsetY + 6);
      
      ctx.save();
      ctx.translate(6, offsetY + canvasHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`◄——— BREADTH: ${hallBreadth} ${hallUnit.toUpperCase()} ———►`, 0, 0);
      ctx.restore();

      // 4. Draw Rectangles & Partition Lines first
      elements.forEach(el => {
        if (el.type === 'rectangle') {
          ctx.save();
          ctx.translate(el.x + el.width / 2, offsetY + el.y + el.height / 2);
          if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.fillStyle = el.fillColor || 'rgba(254, 243, 199, 0.45)';
          ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
          ctx.strokeStyle = el.borderColor || '#d97706';
          ctx.lineWidth = el.borderWidth || 2;
          if (el.borderStyle === 'dashed') ctx.setLineDash([6, 4]);
          else ctx.setLineDash([]);
          ctx.strokeRect(-el.width / 2, -el.height / 2, el.width, el.height);
          ctx.setLineDash([]);

          if (el.label) {
            ctx.fillStyle = '#b45309';
            ctx.font = 'bold 12px Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(el.label, -el.width / 2 + 8, -el.height / 2 + 18);
          }
          ctx.restore();
        } else if (el.type === 'line') {
          ctx.strokeStyle = el.color || '#d97706';
          ctx.lineWidth = el.strokeWidth || 4;
          if (el.style === 'dashed') ctx.setLineDash([8, 6]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(el.x1, offsetY + el.y1);
          ctx.lineTo(el.x2, offsetY + el.y2);
          ctx.stroke();
          ctx.setLineDash([]);

          if (el.label) {
            ctx.fillStyle = el.color || '#d97706';
            ctx.font = 'bold 11px Roboto, sans-serif';
            ctx.textAlign = 'center';
            const midX = (el.x1 + el.x2) / 2;
            const midY = (el.y1 + el.y2) / 2 - 8;
            ctx.fillText(el.label, midX, offsetY + midY);
          }
        }
      });

      // 5. Draw Image Assets (Stage, Dinning Table, Chair, Buffet)
      const imagePromises = elements
        .filter(el => el.type === 'image')
        .map(el => new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.save();
            ctx.translate(el.x + el.width / 2, offsetY + el.y + el.height / 2);
            if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
            ctx.restore();

            // Label under image
            if (el.label && el.type === 'image' && el.height > 60) {
              ctx.fillStyle = '#0f172a';
              ctx.font = '600 10px Roboto, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(el.label, el.x + el.width / 2, offsetY + el.y + el.height + 12);
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = el.src;
        }));

      await Promise.all(imagePromises);

      // 6. Draw Text Annotations with specific font sizes
      elements.filter(el => el.type === 'text').forEach(el => {
        ctx.font = `${el.fontWeight || 'bold'} ${el.fontSize || 16}px Roboto, sans-serif`;
        const textMetrics = ctx.measureText(el.text);
        if (el.hasBackground) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(el.x - 6, offsetY + el.y - (el.fontSize || 16), textMetrics.width + 12, (el.fontSize || 16) + 8);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.x - 6, offsetY + el.y - (el.fontSize || 16), textMetrics.width + 12, (el.fontSize || 16) + 8);
        }
        ctx.fillStyle = el.color || '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText(el.text, el.x, offsetY + el.y);
      });

      // 7. Trigger PNG Download
      offscreen.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Wedding_Hall_Plan_${hallLength}x${hallBreadth}${hallUnit}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setFeedback("Plan exported as high-resolution PNG!");
        setTimeout(() => setFeedback(null), 4000);
      }, 'image/png');
    } catch (err) {
      console.error("Export PNG error:", err);
    } finally {
      setExporting(false);
    }
  };

  // EXPORT TO CLIENT PDF (Printable Architecture Document)
  const handleExportPDF = () => {
    // Counts of items for client proposal
    const stageCount = elements.filter(e => e.src?.includes('stage')).length;
    const tableCount = elements.filter(e => e.src?.includes('dinning_table')).length;
    const chairCount = elements.filter(e => e.src?.includes('chair')).length;
    const buffetCount = elements.filter(e => e.src?.includes('buffet')).length;
    const carCount = elements.filter(e => e.src?.includes('car')).length;
    const doorCount = elements.filter(e => e.src?.includes('door')).length;
    const zoneCount = elements.filter(e => e.type === 'rectangle').length;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Please allow popups to generate the Client PDF presentation.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wedding Venue Plan & Floor Architecture — Client Proposal</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;800&display=swap');
            body {
              font-family: 'Roboto', sans-serif;
              margin: 30px;
              color: #0f172a;
              background: #ffffff;
            }
            .header {
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .brand {
              font-size: 24px;
              font-weight: 800;
              color: #4f46e5;
              letter-spacing: -0.02em;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 4px;
            }
            .meta-bar {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 14px;
            }
            .meta-label {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .meta-val {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 2px;
            }
            .plan-frame {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 16px;
              background: #f8fafc;
              margin-bottom: 24px;
              position: relative;
            }
            .inventory-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 13px;
            }
            .inventory-table th {
              background: #f1f5f9;
              padding: 8px 12px;
              text-align: left;
              border: 1px solid #e2e8f0;
              font-weight: 700;
            }
            .inventory-table td {
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
            }
            .footer-sign {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding-top: 20px;
              border-top: 1px solid #cbd5e1;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 22px; background: #4f46e5; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-family: inherit;">
              Print to PDF / Save as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <div class="brand">KNOTCORE ARCHITECTURE</div>
              <div class="title">Luxury Wedding Venue Floor Plan & Spatial Layout</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                Client Architectural Blueprint for Wedding Banquet Management
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <div><strong>Project:</strong> Royal Wedding Reception</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
              <div><strong>Approval:</strong> Verified Blueprint</div>
            </div>
          </div>

          <div class="meta-bar">
            <div class="meta-card">
              <div class="meta-label">Ground Dimensions</div>
              <div class="meta-val">${hallLength} × ${hallBreadth} ${hallUnit.toUpperCase()}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Total Floor Area</div>
              <div class="meta-val">${(hallLength * hallBreadth).toLocaleString()} sq.${hallUnit}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Partitioning Status</div>
              <div class="meta-val">Dining & Hall Separated</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Estimated Guest Capacity</div>
              <div class="meta-val">${Math.round((hallLength * hallBreadth) / 20)} Guests</div>
            </div>
          </div>

          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Venue Spatial Layout Schematic:
          </div>
          <div class="plan-frame">
            <div style="text-align: center; color: #4f46e5; font-weight: 700; font-size: 12px; margin-bottom: 12px;">
              ◄——— LENGTH: ${hallLength} ${hallUnit.toUpperCase()} ———►
            </div>
            <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; color: #334155; margin: 0 0 8px; font-weight: 600;">
                2D Interactive Layout Plan with Partition Lines & Dimensions
              </p>
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                Configured with <strong>${stageCount}</strong> Mandap Stage, <strong>${tableCount}</strong> Banquet Dining Tables, <strong>${chairCount}</strong> Guest Chairs, <strong>${buffetCount}</strong> Buffet Counters, <strong>${carCount}</strong> Valet Car Bays, <strong>${doorCount}</strong> Grand Entrance Gateways, and <strong>${zoneCount}</strong> Custom Lounge Zones.
              </p>
            </div>
            <div style="text-align: right; color: #4f46e5; font-weight: 700; font-size: 12px; margin-top: 12px;">
              BREADTH: ${hallBreadth} ${hallUnit.toUpperCase()}
            </div>
          </div>

          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px;">
            Physical Furniture & Architectural Fixtures Inventory:
          </div>
          <table class="inventory-table">
            <thead>
              <tr>
                <th>FIXTURE TYPE</th>
                <th>IMAGE ASSET</th>
                <th>COUNT PLANNED</th>
                <th>SPATIAL ZONE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Royal Mandap Stage</strong></td>
                <td>stage.png</td>
                <td>${stageCount} Units</td>
                <td>North Main Dais</td>
                <td>Positioned & Scaled</td>
              </tr>
              <tr>
                <td><strong>Banquet Dining Tables</strong></td>
                <td>dinning_table.png</td>
                <td>${tableCount} Tables (${tableCount * 6} Seated Guests)</td>
                <td>Dining Enclosure</td>
                <td>Arranged & Positioned</td>
              </tr>
              <tr>
                <td><strong>Banquet Chairs</strong></td>
                <td>chair.webp</td>
                <td>${chairCount} Units</td>
                <td>Auditorium / Hall</td>
                <td>Configured & Resized</td>
              </tr>
              <tr>
                <td><strong>Royal Buffet Counters</strong></td>
                <td>buffet.png</td>
                <td>${buffetCount} Stations</td>
                <td>Catering Wings A & B</td>
                <td>Equipped & Formatted</td>
              </tr>
              <tr>
                <td><strong>Valet Car Parking Bays</strong></td>
                <td>car.png</td>
                <td>${carCount} Bays</td>
                <td>Arrival & Valet Zone</td>
                <td>Allocated & Oriented</td>
              </tr>
              <tr>
                <td><strong>Grand Entrance & Exit Doors</strong></td>
                <td>door.png</td>
                <td>${doorCount} Gateways</td>
                <td>Main Ceremonial Portals</td>
                <td>Installed & Positioned</td>
              </tr>
              <tr>
                <td><strong>Floral / Acoustic Partition</strong></td>
                <td>Separation Line</td>
                <td>1 Dedicated Divider</td>
                <td>Hall / Dining Border</td>
                <td>Separating Hall & Dining</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sign">
            <div>
              <strong>KnotCore Lead Wedding Architect</strong><br/>
              Signature & Stamp: ______________________
            </div>
            <div>
              <strong>Client Approval / Couple Sign-off</strong><br/>
              Date & Acknowledgment: ______________________
            </div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    setFeedback("Client PDF presentation ready! Use 'Print to PDF' in the opened window.");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Wedding Plan & Floor Layout Setter
            </h2>
            <span className="badge badge-indigo" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Compass size={12} />
              <span>2D Spatial CAD Engine</span>
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Set ground dimensions, drag & drop stage, dining tables, chairs, and buffet stations. Draw freestyle rectangle zones, partition lines between dining and hall, add typed text with custom font sizing, and export client-ready plans.
          </p>
        </div>

        {/* Global Export & Hall Reconfigure Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setTempLength(hallLength);
              setTempBreadth(hallBreadth);
              setTempUnit(hallUnit);
              setDimModalOpen(true);
            }}
            className="btn-outline"
            style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Settings2 size={14} />
            <span>Hall Dimensions ({hallLength}×{hallBreadth} {hallUnit})</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="btn-outline"
            style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={14} />
            <span>{exporting ? 'Generating...' : 'Export PNG'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} />
            <span>Export Client PDF</span>
          </button>
        </div>
      </div>

      {/* Hall Technical Dimensions & Preset Strip */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
            Ground Size: <strong>{hallLength} {hallUnit} Length</strong> × <strong>{hallBreadth} {hallUnit} Breadth</strong>
            <span style={{ color: '#4f46e5', fontWeight: 700, marginLeft: '8px' }}>
              ({(hallLength * hallBreadth).toLocaleString()} sq.{hallUnit})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Quick Presets:</span>
            {HALL_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadPreset(p)}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: hallLength === p.length && hallBreadth === p.breadth ? '#eef2ff' : '#ffffff',
                  color: hallLength === p.length && hallBreadth === p.breadth ? '#4f46e5' : '#64748b',
                  cursor: 'pointer',
                  fontWeight: hallLength === p.length ? 700 : 500
                }}
              >
                {p.name.split(' ')[0]} ({p.length}×{p.breadth}{p.unit})
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            style={{
              fontSize: '0.72rem',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: snapToGrid ? '#f0fdf4' : '#f8fafc',
              color: snapToGrid ? '#15803d' : '#64748b',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Grid size={12} />
            <span>Snap to Grid: {snapToGrid ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 8px', opacity: historyIndex <= 0 ? 0.4 : 1 }}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={12} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 8px', opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={12} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '8px 14px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Workspace: Left Palette + Canvas + Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>
        
        {/* Left Side: Drag & Drop Palette & Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Tools Box */}
          <div className="saas-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', letterSpacing: '0.04em', marginBottom: '10px' }}>
              DRAWING & PLACEMENT TOOLS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => setActiveTool('select')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: activeTool === 'select' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: activeTool === 'select' ? '#eef2ff' : '#ffffff',
                  color: activeTool === 'select' ? '#4f46e5' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Move size={14} />
                <span>Select & Move / Resize</span>
              </button>

              <button
                onClick={() => {
                  setActiveTool('rectangle');
                  setFeedback("Rectangle Mode: Click & drag on hall canvas to draw custom zone / lounge.");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: activeTool === 'rectangle' ? '1px solid #d97706' : '1px solid #e2e8f0',
                  background: activeTool === 'rectangle' ? '#fffbeb' : '#ffffff',
                  color: activeTool === 'rectangle' ? '#d97706' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Square size={14} />
                <span>Draw Rectangle Zone</span>
              </button>

              <button
                onClick={() => {
                  setActiveTool('line');
                  setFeedback("Partition Line Mode: Click & drag to draw separation line between dining and hall.");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: activeTool === 'line' ? '1px solid #d97706' : '1px solid #e2e8f0',
                  background: activeTool === 'line' ? '#fffbeb' : '#ffffff',
                  color: activeTool === 'line' ? '#d97706' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Minus size={14} />
                <span>Draw Partition Line (Dining/Hall)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTool('text');
                  setFeedback("Text Tool: Click anywhere on hall canvas to place a note. Font size is fully customizable.");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: activeTool === 'text' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: activeTool === 'text' ? '#eef2ff' : '#ffffff',
                  color: activeTool === 'text' ? '#4f46e5' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Type size={14} />
                <span>Type Text / Annotations</span>
              </button>
            </div>
          </div>

          {/* Asset Library Palette */}
          <div className="saas-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', letterSpacing: '0.04em' }}>
                WEDDING FIXTURES PALETTE
              </div>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Drag or Click</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#64748b' }}>
              Drag an item onto the hall canvas, or click to spawn in center.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PLANNER_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(asset));
                  }}
                  onClick={() => addAssetToCanvas(asset)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'grab',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  title="Click to add or drag onto hall plan"
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img 
                      src={asset.src} 
                      alt={asset.name} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                      {asset.category}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#4f46e5', fontWeight: 600 }}>
                      + Add to Plan
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Seating Row Cloner */}
          <div className="saas-card" style={{ padding: '14px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              BATCH SEATING GENERATOR
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.68rem', color: '#64748b' }}>
              Select a chair or dining table to clone an entire row of 5 or 10 identical items.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleCloneRow(5)}
                disabled={!selectedElement || selectedElement.type !== 'image'}
                className="btn-outline"
                style={{ flex: 1, fontSize: '0.72rem', padding: '5px', opacity: selectedElement?.type === 'image' ? 1 : 0.5 }}
              >
                Clone Row of 5
              </button>
              <button
                onClick={() => handleCloneRow(10)}
                disabled={!selectedElement || selectedElement.type !== 'image'}
                className="btn-outline"
                style={{ flex: 1, fontSize: '0.72rem', padding: '5px', opacity: selectedElement?.type === 'image' ? 1 : 0.5 }}
              >
                Clone Row of 10
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Hall Canvas & Object Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Dynamic Selection Properties Toolbar */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            minHeight: '48px'
          }}>
            {selectedElement ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', width: '100%' }}>
                
                {/* Element Name / Label Edit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Label:</span>
                  <input
                    type="text"
                    value={selectedElement.type === 'text' ? (selectedElement.text || '') : (selectedElement.label || '')}
                    onChange={e => handleLabelChange(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.76rem',
                      fontFamily: 'inherit',
                      width: '180px'
                    }}
                  />
                </div>

                {/* Specific Text Font Size Controls (If Text Object) */}
                {selectedElement.type === 'text' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>FONT SIZE:</span>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      value={selectedElement.fontSize || 16}
                      onChange={e => handleFontSizeChange(e.target.value)}
                      style={{ width: '80px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4f46e5', minWidth: '32px' }}>
                      {selectedElement.fontSize || 16}px
                    </span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[12, 16, 22, 32].map(sz => (
                        <button
                          key={sz}
                          onClick={() => handleFontSizeChange(sz)}
                          style={{
                            padding: '2px 5px',
                            fontSize: '0.68rem',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: selectedElement.fontSize === sz ? '#4f46e5' : '#ffffff',
                            color: selectedElement.fontSize === sz ? '#ffffff' : '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resizing Minimise / Maximise Buttons (For Images & Rectangles) */}
                {selectedElement.type !== 'line' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Size:</span>
                    <button
                      onClick={() => handleScaleElement(0.9)}
                      className="btn-outline"
                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      title="Minimise Size (-10%)"
                    >
                      <Minimize2 size={12} />
                      <span>Minimise</span>
                    </button>
                    <button
                      onClick={() => handleScaleElement(1.1)}
                      className="btn-outline"
                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      title="Maximise Size (+10%)"
                    >
                      <Maximize2 size={12} />
                      <span>Maximise</span>
                    </button>
                    {selectedElement.width && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {selectedElement.width}×{selectedElement.height}px
                      </span>
                    )}
                  </div>
                )}

                {/* Rotate Button */}
                {(selectedElement.type === 'image' || selectedElement.type === 'rectangle') && (
                  <button
                    onClick={() => handleRotateElement(45)}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Rotate 45 degrees"
                  >
                    <RotateCw size={12} />
                    <span>Rotate ({selectedElement.rotation || 0}°)</span>
                  </button>
                )}

                {/* Color Picker for Rectangles */}
                {selectedElement.type === 'rectangle' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Zone Color:</span>
                    {[
                      { name: 'Gold', val: 'rgba(254, 243, 199, 0.45)' },
                      { name: 'Indigo', val: 'rgba(224, 231, 255, 0.45)' },
                      { name: 'Emerald', val: 'rgba(209, 250, 229, 0.45)' },
                      { name: 'Rose', val: 'rgba(255, 228, 230, 0.45)' },
                      { name: 'Slate', val: 'rgba(241, 245, 249, 0.6)' }
                    ].map(c => (
                      <button
                        key={c.name}
                        onClick={() => handleFillColorChange(c.val)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          background: c.val,
                          border: selectedElement.fillColor === c.val ? '2px solid #0f172a' : '1px solid #cbd5e1',
                          cursor: 'pointer'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}

                {/* Copy, Paste & Delete Actions */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={handleCopy}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
                    title="Copy (Ctrl+C)"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handlePaste}
                    disabled={!clipboard}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px', opacity: clipboard ? 1 : 0.4 }}
                    title="Paste Multiple Times (Ctrl+V)"
                  >
                    <Clipboard size={12} />
                    <span>Paste</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title="Delete Element (Delete)"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.76rem' }}>
                <Move size={14} />
                <span>Click any item on the plan to inspect, resize, change font size, or duplicate. Use <strong>Ctrl+C</strong> and <strong>Ctrl+V</strong> to copy-paste multiple times.</span>
              </div>
            )}
          </div>

          {/* Interactive Hall Canvas Area */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            
            {/* Top Ruler / Length Indicator */}
            <div style={{
              width: `${canvasWidth}px`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#4f46e5',
              padding: '0 10px 4px'
            }}>
              <span>0 {hallUnit}</span>
              <span style={{ background: '#eef2ff', padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                ◄——— HALL LENGTH: {hallLength} {hallUnit.toUpperCase()} ———►
              </span>
              <span>{hallLength} {hallUnit}</span>
            </div>

            {/* Canvas Main Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              
              {/* Left Ruler / Breadth Indicator */}
              <div style={{
                height: `${canvasHeight}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#4f46e5',
                width: '24px'
              }}>
                <span>0</span>
                <div style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  background: '#eef2ff',
                  padding: '10px 2px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap'
                }}>
                  BREADTH: {hallBreadth} {hallUnit.toUpperCase()}
                </div>
                <span>{hallBreadth}</span>
              </div>

              {/* Floor Plan Canvas */}
              <div
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDropOnCanvas}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                  background: '#f8fafc',
                  border: '3px solid #0f172a',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: activeTool === 'select' ? 'default' : 'crosshair',
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  userSelect: 'none'
                }}
              >
                
                {/* SVG Overlay for Lines, Partitions, and Interactive Rectangles */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  {/* Drawing in progress preview */}
                  {drawingStart && drawingCurrent && activeTool === 'rectangle' && (
                    <rect
                      x={Math.min(drawingStart.x, drawingCurrent.x)}
                      y={Math.min(drawingStart.y, drawingCurrent.y)}
                      width={Math.abs(drawingCurrent.x - drawingStart.x)}
                      height={Math.abs(drawingCurrent.y - drawingStart.y)}
                      fill="rgba(254, 243, 199, 0.45)"
                      stroke="#d97706"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  )}

                  {drawingStart && drawingCurrent && activeTool === 'line' && (
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={drawingCurrent.x}
                      y2={drawingCurrent.y}
                      stroke="#d97706"
                      strokeWidth="4"
                      strokeDasharray="8 6"
                    />
                  )}

                  {/* Rendered Lines / Partitions */}
                  {elements.filter(el => el.type === 'line').map(line => (
                    <g key={line.id}>
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={line.color || '#d97706'}
                        strokeWidth={line.strokeWidth || 4}
                        strokeDasharray={line.style === 'dashed' ? '8 6' : 'none'}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                        onMouseDown={(e) => handleElementMouseDown(e, line)}
                      />
                      {line.label && (
                        <text
                          x={(line.x1 + line.x2) / 2}
                          y={(line.y1 + line.y2) / 2 - 8}
                          fill={line.color || '#d97706'}
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="Roboto, sans-serif"
                        >
                          {line.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Rendered Rectangles */}
                {elements.filter(el => el.type === 'rectangle').map(rect => {
                  const isSelected = selectedId === rect.id;
                  return (
                    <div
                      key={rect.id}
                      onMouseDown={(e) => handleElementMouseDown(e, rect)}
                      style={{
                        position: 'absolute',
                        left: `${rect.x}px`,
                        top: `${rect.y}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        background: rect.fillColor || 'rgba(254, 243, 199, 0.45)',
                        border: `${rect.borderWidth || 2}px ${rect.borderStyle || 'dashed'} ${rect.borderColor || '#d97706'}`,
                        borderRadius: '6px',
                        cursor: 'move',
                        transform: `rotate(${rect.rotation || 0}deg)`,
                        transformOrigin: 'center center',
                        boxShadow: isSelected ? '0 0 0 1.5px #2563eb' : 'none',
                        outline: isSelected ? '1px dashed #3b82f6' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '6px 8px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', pointerEvents: 'none' }}>
                        {rect.label}
                      </div>

                      {/* 8 Perimeter Axis Handles + Top Rotation Handle */}
                      {isSelected && (
                        <TransformerHandles
                          element={rect}
                          isRotating={isRotating}
                          onResizeMouseDown={handleResizeHandleMouseDown}
                          onRotateMouseDown={handleRotateHandleMouseDown}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Rendered Images (Stage, Dinning Table, Chair, Buffet, Car, Door) */}
                {elements.filter(el => el.type === 'image').map(imgEl => {
                  const isSelected = selectedId === imgEl.id;
                  return (
                    <div
                      key={imgEl.id}
                      onMouseDown={(e) => handleElementMouseDown(e, imgEl)}
                      style={{
                        position: 'absolute',
                        left: `${imgEl.x}px`,
                        top: `${imgEl.y}px`,
                        width: `${imgEl.width}px`,
                        height: `${imgEl.height}px`,
                        cursor: 'move',
                        transform: `rotate(${imgEl.rotation || 0}deg)`,
                        transformOrigin: 'center center',
                        boxSizing: 'border-box',
                        boxShadow: isSelected ? '0 0 0 1.5px #2563eb' : 'none',
                        outline: isSelected ? '1px dashed rgba(37, 99, 235, 0.5)' : 'none'
                      }}
                    >
                      <img
                        src={imgEl.src}
                        alt={imgEl.name}
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* 8 Perimeter Axis Handles + Top Rotation Handle */}
                      {isSelected && (
                        <TransformerHandles
                          element={imgEl}
                          isRotating={isRotating}
                          onResizeMouseDown={handleResizeHandleMouseDown}
                          onRotateMouseDown={handleRotateHandleMouseDown}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Rendered Text Elements with custom font size */}
                {elements.filter(el => el.type === 'text').map(txtEl => {
                  const isSelected = selectedId === txtEl.id;
                  return (
                    <div
                      key={txtEl.id}
                      onMouseDown={(e) => handleElementMouseDown(e, txtEl)}
                      style={{
                        position: 'absolute',
                        left: `${txtEl.x}px`,
                        top: `${txtEl.y}px`,
                        cursor: 'move',
                        padding: '4px 8px',
                        background: txtEl.hasBackground ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                        border: isSelected ? '2px solid #4f46e5' : txtEl.hasBackground ? '1px solid #cbd5e1' : 'none',
                        borderRadius: '6px',
                        fontSize: `${txtEl.fontSize || 16}px`,
                        fontWeight: txtEl.fontWeight || 'bold',
                        color: txtEl.color || '#0f172a',
                        whiteSpace: 'nowrap',
                        boxShadow: isSelected ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none'
                      }}
                    >
                      {txtEl.text}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Bottom Scale Legend */}
            <div style={{ width: `${canvasWidth}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.72rem', color: '#64748b' }}>
              <div>
                Scale: <strong>1 grid square = 10 {hallUnit}</strong> • Total Placed Items: <strong>{elements.length}</strong>
              </div>
              <div>
                Click item to select • Drag corners to resize • Press <strong>Ctrl+C</strong> / <strong>Ctrl+V</strong> to duplicate
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* HALL DIMENSION CONFIGURATION MODAL */}
      {dimModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Configure Ground / Hall Dimensions
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Enter the real-world venue measurements. The CAD canvas scales automatically to match the ground aspect ratio.
                </p>
              </div>
              <button onClick={() => setDimModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyDimensions}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    HALL LENGTH ({tempUnit.toUpperCase()}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="500"
                    value={tempLength}
                    onChange={e => setTempLength(parseFloat(e.target.value) || 120)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    HALL BREADTH / WIDTH ({tempUnit.toUpperCase()}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="500"
                    value={tempBreadth}
                    onChange={e => setTempBreadth(parseFloat(e.target.value) || 80)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    MEASUREMENT UNIT
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="unit"
                        value="ft"
                        checked={tempUnit === 'ft'}
                        onChange={() => setTempUnit('ft')}
                      />
                      <span>Feet (ft) • Imperial</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="unit"
                        value="m"
                        checked={tempUnit === 'm'}
                        onChange={() => setTempUnit('m')}
                      />
                      <span>Meters (m) • Metric</span>
                    </label>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                  Calculated Floor Area: <strong>{(tempLength * tempBreadth).toLocaleString()} sq.{tempUnit}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Aspect ratio: {(tempLength / tempBreadth).toFixed(2)}:1
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setDimModalOpen(false)}
                  className="btn-outline"
                  style={{ fontSize: '0.8rem', padding: '7px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '7px 20px' }}
                >
                  Apply Hall Dimensions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
