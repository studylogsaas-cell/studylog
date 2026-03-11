import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ConnectionLineType,
    Node,
    Edge,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import MindMapNode from './MindMapNode';

interface TreeNode {
    id: string;
    label: string;
    content: string;
    children: TreeNode[];
    isCollapsed?: boolean;
    colorContext?: { bg: string; border: string; text: string };
}

interface MindMapVisualProps {
    treeData: TreeNode;
    onChange: (tree: TreeNode) => void;
    readOnly?: boolean;
}

const nodeTypes = {
    custom: MindMapNode,
};

const PALETTE = [
    { name: 'Padrão (Índigo)', bg: 'var(--bg-light)', border: 'var(--accent-primary)', text: 'var(--text-primary)' },
    { name: 'Azul', bg: 'var(--bg-light)', border: 'var(--accent-info)', text: 'var(--text-primary)' },
    { name: 'Verde', bg: 'var(--bg-light)', border: 'var(--accent-success)', text: 'var(--text-primary)' },
    { name: 'Amarelo', bg: 'var(--bg-light)', border: 'var(--accent-warning)', text: 'var(--text-primary)' },
    { name: 'Vermelho', bg: 'var(--bg-light)', border: 'var(--accent-danger)', text: 'var(--text-primary)' },
    { name: 'Roxo', bg: 'var(--bg-light)', border: '#a855f7', text: 'var(--text-primary)' },
];

// Dagre Algoritmo de Arumação Limpa
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Config do Layout
    const nodeWidth = 220;
    const nodeHeight = 80;
    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
        node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        return node;
    });

    return { nodes, edges };
};

// Helper p/ converter nossa árvore pro Array do React Flow
const treeToElements = (
    node: TreeNode,
    depth: number = 0,
    onToggleCollapse?: (id: string) => void,
    onAddChild?: (id: string) => void
): { nodes: Node[], edges: Edge[] } => {
    const elements: { nodes: Node[], edges: Edge[] } = { nodes: [], edges: [] };

    const flowNode: Node = {
        id: node.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
            label: node.label,
            content: node.content,
            depth,
            isRoot: depth === 0,
            hasChildren: node.children && node.children.length > 0,
            isCollapsed: node.isCollapsed,
            colorContext: node.colorContext,
            onToggleCollapse: () => onToggleCollapse?.(node.id),
            onAddChild: () => onAddChild?.(node.id),
        },
    };
    elements.nodes.push(flowNode);

    if (!node.isCollapsed && node.children) {
        node.children.forEach(child => {
            const edge: Edge = {
                id: `e-${node.id}-${child.id}`,
                source: node.id,
                target: child.id,
                type: 'smoothstep',
                animated: false,
                style: { stroke: 'var(--border-light)', strokeWidth: 2 },
            };
            elements.edges.push(edge);

            const childElements = treeToElements(child, depth + 1, onToggleCollapse, onAddChild);
            elements.nodes.push(...childElements.nodes);
            elements.edges.push(...childElements.edges);
        });
    }

    return elements;
};

// Manipular a árvore no nível principal
function cloneTree(tree: TreeNode): TreeNode {
    return { ...tree, children: tree.children ? tree.children.map(c => cloneTree(c)) : [] };
}

function findNode(tree: TreeNode, id: string): TreeNode | null {
    if (tree.id === id) return tree;
    if (tree.children) {
        for (const child of tree.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

function findParent(tree: TreeNode, id: string): TreeNode | null {
    if (tree.children) {
        for (const child of tree.children) {
            if (child.id === id) return tree;
            const found = findParent(child, id);
            if (found) return found;
        }
    }
    return null;
}

let nodeCounter = Date.now();
function nextId() { return String(++nodeCounter); }


function MindMapFlow({ treeData, onChange, readOnly }: MindMapVisualProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [editNodeId, setEditNodeId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ label: string; content: string; colorContext?: { bg: string; border: string; text: string } }>({ label: '', content: '' });
    const { fitView } = useReactFlow();

    const onToggleCollapse = useCallback((id: string) => {
        if (readOnly) return;
        const newTree = cloneTree(treeData);
        const node = findNode(newTree, id);
        if (node) {
            node.isCollapsed = !node.isCollapsed;
            onChange(newTree);
        }
    }, [treeData, onChange, readOnly]);

    const onAddChild = useCallback((parentId: string) => {
        if (readOnly) return;
        const newTree = cloneTree(treeData);
        const parent = findNode(newTree, parentId);
        if (parent) {
            const newNode: TreeNode = { id: nextId(), label: 'Novo tópico', content: '', children: [] };
            if (!parent.children) parent.children = [];
            parent.children.push(newNode);
            parent.isCollapsed = false; // forced open
            onChange(newTree);
            setEditNodeId(newNode.id);
            setEditForm({ label: newNode.label, content: newNode.content, colorContext: newNode.colorContext });
            // After timeout wait react flow push to fit view
            setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
        }
    }, [treeData, onChange, readOnly, fitView]);

    const onDeleteNode = useCallback((id: string) => {
        if (readOnly || id === treeData.id) return;
        const newTree = cloneTree(treeData);
        const parent = findParent(newTree, id);
        if (parent && parent.children) {
            parent.children = parent.children.filter(c => c.id !== id);
            onChange(newTree);
        }
    }, [treeData, onChange, readOnly]);

    // Recalcular layout no React Flow sempre que TreeData mudar do BD/Estado principal
    useEffect(() => {
        const elements = treeToElements(treeData, 0, onToggleCollapse, onAddChild);
        // Automatic Layout via Dagre
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(elements.nodes, elements.edges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Timeout para garantir que o container foi renderizado
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 500 });
        }, 50);
    }, [treeData, onToggleCollapse, onAddChild, setNodes, setEdges, fitView]);

    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const saveEdit = () => {
        if (!editNodeId) return;
        const newTree = cloneTree(treeData);
        const node = findNode(newTree, editNodeId);
        if (node) {
            node.label = editForm.label;
            node.content = editForm.content;
            node.colorContext = editForm.colorContext;
            onChange(newTree);
        }
        setEditNodeId(null);
    };

    const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
        if (readOnly) return;
        setEditNodeId(node.id);
        const sourceData = findNode(treeData, node.id);
        if (sourceData) {
            setEditForm({ label: sourceData.label, content: sourceData.content, colorContext: sourceData.colorContext });
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editNodeId || readOnly) return;

            const selectedNode = nodes.find(n => n.selected);
            if (!selectedNode) return;

            if (e.key === 'Backspace' || e.key === 'Delete') {
                onDeleteNode(selectedNode.id);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                onAddChild(selectedNode.id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, editNodeId, readOnly, onDeleteNode, onAddChild]);


    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        window.requestAnimationFrame(() => fitView({ padding: 0.2, duration: 800 }));
    }, [nodes, edges, setNodes, setEdges, fitView]);

    const ref = useRef<HTMLDivElement>(null);

    // Export PNG Feature for React Flow
    const exportPng = async () => {
        if (!ref.current) return;
        try {
            const html2canvas = (await import('html2canvas')).default;
            // Temporarily hide UI elements for clean export
            const controls = ref.current.querySelector('.react-flow__controls') as HTMLElement;
            const panel = ref.current.querySelector('.react-flow__panel') as HTMLElement;
            if (controls) controls.style.display = 'none';
            if (panel) panel.style.display = 'none';

            const canvas = await html2canvas(ref.current, { backgroundColor: '#151d2e', scale: 2 });

            if (controls) controls.style.display = 'flex';
            if (panel) panel.style.display = 'block';

            const link = document.createElement('a');
            link.download = `studylog-map-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export error:', error);
        }
    };


    return (
        <div ref={ref} style={{ width: '100%', height: '600px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeDoubleClick={handleNodeDoubleClick}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                nodesDraggable={!readOnly}
                nodesConnectable={false} // Disable connections directly to avoid tree logic break
                elementsSelectable={!readOnly}
                minZoom={0.2}
                maxZoom={4}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="var(--border-light)" gap={16} size={1} />
                <Controls showInteractive={false} />

                {!readOnly && (
                    <Panel position="top-right" className="mindmap-toolbar" style={{ margin: '16px', display: 'flex', gap: '8px', zIndex: 5 }}>
                        <button className="btn btn-sm btn-secondary" onClick={onLayout} title="Auto-Alinhar Nós">
                            🪄 Auto Organizar
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={exportPng}>
                            📷 Exportar PNG
                        </button>
                    </Panel>
                )}
            </ReactFlow>

            {/* Modal de Edição (Rich Text futuro ou Texto Limpo) */}
            {editNodeId && (
                <div className="modal-overlay" onClick={() => setEditNodeId(null)} style={{ zIndex: 1000 }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>✏️ Editar Tópico</h2>
                        <div className="form-group">
                            <label>Título principal</label>
                            <input type="text" className="form-control" value={editForm.label}
                                onChange={e => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                                autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Detalhes (Markdown nativo em breve)</label>
                            <textarea className="form-control" value={editForm.content}
                                onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                rows={4} placeholder="Adicione notas rápidas ou um resumo..." />
                        </div>

                        <div className="form-group">
                            <label>Cor do Nó</label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <div
                                    onClick={() => setEditForm(prev => ({ ...prev, colorContext: undefined }))}
                                    style={{
                                        width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                                        background: 'var(--bg-light)', border: '2px dashed var(--text-muted)',
                                        opacity: !editForm.colorContext ? 1 : 0.5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Cor Automática (por Nível)"
                                >
                                    <span style={{ fontSize: '12px' }}>A</span>
                                </div>
                                {PALETTE.map((c, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setEditForm(prev => ({ ...prev, colorContext: { bg: c.bg, border: c.border, text: c.text } }))}
                                        style={{
                                            width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                                            background: c.bg, border: `2px solid ${c.border}`,
                                            opacity: editForm.colorContext?.border === c.border ? 1 : 0.4
                                        }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setEditNodeId(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveEdit}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS helper para o botão de Adição Rápida escondido dentro do React FLow */}
            <style>{`.mindmap-flow-node:hover .quick-add-btn { opacity: 1 !important;  }`}</style>
        </div>
    );
}

export default function MindMapVisual(props: MindMapVisualProps) {
    return (
        <ReactFlowProvider>
            <MindMapFlow {...props} />
        </ReactFlowProvider>
    );
}
