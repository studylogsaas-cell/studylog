import { useState } from 'react';
import MindMapOutliner from './MindMapOutliner';
import MindMapVisual from './MindMapVisual';

interface TreeNode {
    id: string;
    label: string;
    content: string;
    children: TreeNode[];
}

interface DualMindMapEditorProps {
    treeData: TreeNode;
    onChange: (tree: TreeNode) => void;
    readOnly?: boolean;
}

type Mode = 'outliner' | 'visual';

export default function DualMindMapEditor({ treeData, onChange, readOnly }: DualMindMapEditorProps) {
    const [mode, setMode] = useState<Mode>('outliner');

    return (
        <div className="dual-mindmap">
            <div className="dual-mindmap-tabs">
                <button
                    className={`dual-tab ${mode === 'outliner' ? 'active' : ''}`}
                    onClick={() => setMode('outliner')}
                >
                    📝 Tópicos
                </button>
                <button
                    className={`dual-tab ${mode === 'visual' ? 'active' : ''}`}
                    onClick={() => setMode('visual')}
                >
                    🌐 Mapa Visual
                </button>
            </div>

            <div className="dual-mindmap-content">
                {mode === 'outliner' ? (
                    <MindMapOutliner
                        treeData={treeData}
                        onChange={onChange}
                        readOnly={readOnly}
                    />
                ) : (
                    <MindMapVisual
                        treeData={treeData}
                        onChange={onChange}
                        readOnly={readOnly}
                    />
                )}
            </div>
        </div>
    );
}
