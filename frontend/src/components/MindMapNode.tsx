import { Handle, Position } from '@xyflow/react';

interface MindMapNodeProps {
    data: {
        label: string;
        content: string;
        depth: number;
        isRoot: boolean;
        isCollapsed?: boolean;
        hasChildren?: boolean;
        onToggleCollapse?: () => void;
        onAddChild?: () => void;
        colorContext?: { bg: string; border: string; text: string };
    };
    selected?: boolean;
}

const DEPTH_COLORS = [
    { bg: 'var(--bg-light)', border: 'var(--accent-primary)', text: 'var(--text-primary)' },
    { bg: 'var(--bg-light)', border: 'var(--accent-info)', text: 'var(--text-primary)' },
    { bg: 'var(--bg-light)', border: 'var(--accent-success)', text: 'var(--text-primary)' },
    { bg: 'var(--bg-light)', border: 'var(--accent-warning)', text: 'var(--text-primary)' },
    { bg: 'var(--bg-light)', border: 'var(--accent-danger)', text: 'var(--text-primary)' },
    { bg: 'var(--bg-light)', border: '#a855f7', text: 'var(--text-primary)' },
];

export default function MindMapNode({ data, selected }: MindMapNodeProps) {
    const color = data.colorContext || DEPTH_COLORS[data.depth % DEPTH_COLORS.length];

    return (
        <div
            className={`mindmap-flow-node ${selected ? 'selected' : ''}`}
            style={{
                background: color.bg,
                borderColor: selected ? color.border : 'var(--border-light)',
                boxShadow: selected ? `0 0 0 2px ${color.border}40` : '0 2px 8px rgba(0,0,0,0.2)',
                borderRadius: data.isRoot ? '12px' : '8px',
                borderWidth: selected ? '2px' : '1px',
                borderStyle: 'solid',
                padding: '12px 16px',
                minWidth: '180px',
                maxWidth: '220px',
                position: 'relative',
                transition: 'all 0.2s',
            }}
        >
            {/* Input target handle */}
            {!data.isRoot && (
                <Handle type="target" position={Position.Left} style={{ background: color.border, width: 8, height: 8 }} />
            )}

            <div style={{ color: color.text, fontWeight: 700, fontSize: data.isRoot ? '1rem' : '0.9rem', marginBottom: data.content ? '4px' : '0', wordBreak: 'break-word' }}>
                {data.label || 'Tópico Vazio'}
            </div>
            {data.content && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.85, lineHeight: 1.4, maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.content}
                </div>
            )}

            {/* Hint for editing */}
            {selected && (
                <div style={{ position: 'absolute', top: -20, right: 0, fontSize: '10px', color: 'var(--text-muted)' }}>
                    2x para editar
                </div>
            )}

            {/* Fold/Unfold button if has children */}
            {data.hasChildren && (
                <button
                    className="nodrag"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onToggleCollapse) data.onToggleCollapse();
                    }}
                    style={{
                        position: 'absolute',
                        right: -12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--bg-dark)',
                        border: `1px solid ${color.border}`,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title={data.isCollapsed ? "Expandir" : "Recolher"}
                >
                    {data.isCollapsed ? '+' : '-'}
                </button>
            )}

            {/* Quick Add Button underneath for UX if selected */}
            {selected && (
                <button
                    className="nodrag quick-add-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onAddChild) data.onAddChild();
                    }}
                    style={{
                        position: 'absolute',
                        bottom: -16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: color.border,
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        opacity: 0,
                        transition: 'opacity 0.2s'
                    }}
                    title="Adicionar Filho"
                >
                    +
                </button>
            )}

            {/* Output source handle */}
            <Handle type="source" position={Position.Right} style={{ background: color.border, width: 8, height: 8, opacity: data.isCollapsed ? 0 : 1 }} />
        </div>
    );
}
