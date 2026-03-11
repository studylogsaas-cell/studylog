import { useState, useRef, useCallback, useEffect } from 'react';

interface TreeNode {
    id: string;
    label: string;
    content: string;
    children: TreeNode[];
}

interface MindMapEditorProps {
    treeData: TreeNode;
    onChange: (tree: TreeNode) => void;
    onExportPng?: () => void;
    readOnly?: boolean;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const NODE_GAP_X = 60;
const NODE_GAP_Y = 20;

interface LayoutNode {
    node: TreeNode;
    x: number;
    y: number;
    width: number;
    height: number;
    children: LayoutNode[];
}

function layoutTree(node: TreeNode, x: number, y: number): { layout: LayoutNode; totalHeight: number } {
    if (node.children.length === 0) {
        return {
            layout: { node, x, y, width: NODE_WIDTH, height: NODE_HEIGHT, children: [] },
            totalHeight: NODE_HEIGHT,
        };
    }

    const childLayouts: LayoutNode[] = [];
    let currentY = y;
    let totalChildHeight = 0;

    for (let i = 0; i < node.children.length; i++) {
        const { layout, totalHeight } = layoutTree(node.children[i], x + NODE_WIDTH + NODE_GAP_X, currentY);
        childLayouts.push(layout);
        currentY += totalHeight + NODE_GAP_Y;
        totalChildHeight += totalHeight + (i < node.children.length - 1 ? NODE_GAP_Y : 0);
    }

    const parentY = childLayouts.length > 0
        ? (childLayouts[0].y + childLayouts[childLayouts.length - 1].y + NODE_HEIGHT) / 2 - NODE_HEIGHT / 2
        : y;

    return {
        layout: { node, x, y: parentY, width: NODE_WIDTH, height: NODE_HEIGHT, children: childLayouts },
        totalHeight: Math.max(totalChildHeight, NODE_HEIGHT),
    };
}

function getTreeBounds(layout: LayoutNode): { maxX: number; maxY: number } {
    let maxX = layout.x + layout.width;
    let maxY = layout.y + layout.height;
    for (const child of layout.children) {
        const childBounds = getTreeBounds(child);
        maxX = Math.max(maxX, childBounds.maxX);
        maxY = Math.max(maxY, childBounds.maxY);
    }
    return { maxX, maxY };
}

let nodeIdCounter = Date.now();
function nextId() {
    return String(++nodeIdCounter);
}

export default function MindMapEditor({ treeData, onChange, readOnly }: MindMapEditorProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editNode, setEditNode] = useState<{ id: string; label: string; content: string } | null>(null);

    const { layout, totalHeight } = layoutTree(treeData, 30, 30);
    const bounds = getTreeBounds(layout);
    const svgWidth = Math.max(bounds.maxX + 60, 600);
    const svgHeight = Math.max(bounds.maxY + 60, 400);

    const findNode = useCallback((tree: TreeNode, id: string): TreeNode | null => {
        if (tree.id === id) return tree;
        for (const child of tree.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
        return null;
    }, []);

    const findParent = useCallback((tree: TreeNode, id: string): TreeNode | null => {
        for (const child of tree.children) {
            if (child.id === id) return tree;
            const found = findParent(child, id);
            if (found) return found;
        }
        return null;
    }, []);

    const cloneTree = useCallback((tree: TreeNode): TreeNode => {
        return {
            ...tree,
            children: tree.children.map(c => cloneTree(c)),
        };
    }, []);

    const addChild = () => {
        if (!selectedId) return;
        const newTree = cloneTree(treeData);
        const parent = findNode(newTree, selectedId);
        if (parent) {
            const newNode: TreeNode = { id: nextId(), label: 'Novo nó', content: '', children: [] };
            parent.children.push(newNode);
            onChange(newTree);
            setSelectedId(newNode.id);
        }
    };

    const deleteNode = () => {
        if (!selectedId || selectedId === treeData.id) return;
        const newTree = cloneTree(treeData);
        const parent = findParent(newTree, selectedId);
        if (parent) {
            parent.children = parent.children.filter(c => c.id !== selectedId);
            onChange(newTree);
            setSelectedId(null);
        }
    };

    const startEdit = () => {
        if (!selectedId) return;
        const node = findNode(treeData, selectedId);
        if (node) setEditNode({ id: node.id, label: node.label, content: node.content });
    };

    const saveEdit = () => {
        if (!editNode) return;
        const newTree = cloneTree(treeData);
        const node = findNode(newTree, editNode.id);
        if (node) {
            node.label = editNode.label;
            node.content = editNode.content;
            onChange(newTree);
        }
        setEditNode(null);
    };

    const moveNode = (direction: 'up' | 'down') => {
        if (!selectedId || selectedId === treeData.id) return;
        const newTree = cloneTree(treeData);
        const parent = findParent(newTree, selectedId);
        if (!parent) return;
        const idx = parent.children.findIndex(c => c.id === selectedId);
        if (direction === 'up' && idx > 0) {
            [parent.children[idx - 1], parent.children[idx]] = [parent.children[idx], parent.children[idx - 1]];
            onChange(newTree);
        } else if (direction === 'down' && idx < parent.children.length - 1) {
            [parent.children[idx], parent.children[idx + 1]] = [parent.children[idx + 1], parent.children[idx]];
            onChange(newTree);
        }
    };

    const exportPng = async () => {
        if (!containerRef.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: '#151d2e',
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `mapa-mental-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const renderNode = (layoutNode: LayoutNode) => {
        const { node, x, y, width, height, children: childLayouts } = layoutNode;
        const isSelected = selectedId === node.id;
        const isRoot = node.id === treeData.id;

        return (
            <g key={node.id}>
                {/* Links to children */}
                {childLayouts.map(child => (
                    <path
                        key={`link-${child.node.id}`}
                        className="mindmap-link"
                        d={`M ${x + width} ${y + height / 2} C ${x + width + NODE_GAP_X / 2} ${y + height / 2}, ${child.x - NODE_GAP_X / 2} ${child.y + child.height / 2}, ${child.x} ${child.y + child.height / 2}`}
                    />
                ))}

                {/* Node */}
                <g
                    className={`mindmap-node ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) {
                            setSelectedId(node.id);
                            setEditNode({ id: node.id, label: node.label, content: node.content });
                        }
                    }}
                >
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        style={isRoot ? { fill: 'rgba(99, 102, 241, 0.2)', stroke: '#6366f1', strokeWidth: 2 } : undefined}
                    />
                    <text x={x + 10} y={y + 22} style={{ fontSize: 13, fontWeight: 600 }}>
                        {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                    </text>
                    {node.content && (
                        <text x={x + 10} y={y + 40} className="node-content">
                            {node.content.length > 24 ? node.content.substring(0, 22) + '...' : node.content}
                        </text>
                    )}
                </g>

                {/* Render children */}
                {childLayouts.map(child => renderNode(child))}
            </g>
        );
    };

    return (
        <div>
            {!readOnly && (
                <div className="mindmap-toolbar">
                    <button className="btn btn-sm btn-primary" onClick={addChild} disabled={!selectedId}>
                        ➕ Adicionar Filho
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={startEdit} disabled={!selectedId}>
                        ✏️ Editar
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => moveNode('up')} disabled={!selectedId || selectedId === treeData.id}>
                        ⬆️ Mover
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => moveNode('down')} disabled={!selectedId || selectedId === treeData.id}>
                        ⬇️ Mover
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={deleteNode} disabled={!selectedId || selectedId === treeData.id}>
                        🗑️ Remover
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-sm btn-secondary" onClick={exportPng}>
                        📷 Exportar PNG
                    </button>
                </div>
            )}

            <div ref={containerRef} className="mindmap-container" style={{ overflow: 'auto' }}>
                <svg ref={svgRef} className="mindmap-svg" width={svgWidth} height={svgHeight}
                    onClick={() => setSelectedId(null)}>
                    {renderNode(layout)}
                </svg>
            </div>

            {/* Edit modal */}
            {editNode && (
                <div className="modal-overlay" onClick={() => setEditNode(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Editar Nó</h2>
                        <div className="form-group">
                            <label>Título</label>
                            <input type="text" className="form-control" value={editNode.label}
                                onChange={e => setEditNode({ ...editNode, label: e.target.value })}
                                autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Conteúdo</label>
                            <textarea className="form-control" value={editNode.content}
                                onChange={e => setEditNode({ ...editNode, content: e.target.value })}
                                rows={3} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setEditNode(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveEdit}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
