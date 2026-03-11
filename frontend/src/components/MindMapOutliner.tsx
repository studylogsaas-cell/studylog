import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface TreeNode {
    id: string;
    label: string;
    content: string;
    children: TreeNode[];
}

interface MindMapOutlinerProps {
    treeData: TreeNode;
    onChange: (tree: TreeNode) => void;
    readOnly?: boolean;
}

let outlinerIdCounter = Date.now();
function nextId() { return String(++outlinerIdCounter); }

function cloneTree(tree: TreeNode): TreeNode {
    return { ...tree, children: tree.children.map(c => cloneTree(c)) };
}

interface FlatItem {
    node: TreeNode;
    depth: number;
    path: number[]; // indices from root to this node
}

function flattenTree(node: TreeNode, depth: number = 0, path: number[] = []): FlatItem[] {
    const items: FlatItem[] = [{ node, depth, path }];
    node.children.forEach((child, idx) => {
        items.push(...flattenTree(child, depth + 1, [...path, idx]));
    });
    return items;
}

function getNodeByPath(tree: TreeNode, path: number[]): TreeNode {
    let current = tree;
    for (const idx of path) {
        current = current.children[idx];
    }
    return current;
}

function getParentByPath(tree: TreeNode, path: number[]): TreeNode | null {
    if (path.length === 0) return null;
    return getNodeByPath(tree, path.slice(0, -1));
}

export default function MindMapOutliner({ treeData, onChange, readOnly }: MindMapOutlinerProps) {
    const [focusedPath, setFocusedPath] = useState<string>('');
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const items = flattenTree(treeData);

    const pathKey = (path: number[]) => path.join('-') || 'root';

    useEffect(() => {
        if (focusedPath) {
            const input = inputRefs.current.get(focusedPath);
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }, [focusedPath, items.length]);

    const handleLabelChange = (item: FlatItem, newLabel: string) => {
        const newTree = cloneTree(treeData);
        const node = getNodeByPath(newTree, item.path);
        node.label = newLabel;
        onChange(newTree);
    };

    const handleContentChange = (item: FlatItem, newContent: string) => {
        const newTree = cloneTree(treeData);
        const node = getNodeByPath(newTree, item.path);
        node.content = newContent;
        onChange(newTree);
    };

    const addSibling = (item: FlatItem) => {
        if (item.path.length === 0) {
            // Root: add child instead
            addChild(item);
            return;
        }
        const newTree = cloneTree(treeData);
        const parent = getParentByPath(newTree, item.path)!;
        const idx = item.path[item.path.length - 1];
        const newNode: TreeNode = { id: nextId(), label: '', content: '', children: [] };
        parent.children.splice(idx + 1, 0, newNode);
        onChange(newTree);
        const newPath = [...item.path.slice(0, -1), idx + 1];
        setFocusedPath(pathKey(newPath));
    };

    const addChild = (item: FlatItem) => {
        const newTree = cloneTree(treeData);
        const node = getNodeByPath(newTree, item.path);
        const newNode: TreeNode = { id: nextId(), label: '', content: '', children: [] };
        node.children.push(newNode);
        onChange(newTree);
        const newPath = [...item.path, node.children.length - 1];
        setFocusedPath(pathKey(newPath));
    };

    const deleteNode = (item: FlatItem) => {
        if (item.path.length === 0) return; // Can't delete root
        const newTree = cloneTree(treeData);
        const parent = getParentByPath(newTree, item.path)!;
        const idx = item.path[item.path.length - 1];
        parent.children.splice(idx, 1);
        onChange(newTree);
        // Focus parent
        setFocusedPath(pathKey(item.path.slice(0, -1)));
    };

    const indent = (item: FlatItem) => {
        // Make node a child of its previous sibling
        if (item.path.length === 0) return;
        const idx = item.path[item.path.length - 1];
        if (idx === 0) return; // No previous sibling

        const newTree = cloneTree(treeData);
        const parent = getParentByPath(newTree, item.path)!;
        const node = parent.children.splice(idx, 1)[0];
        const prevSibling = parent.children[idx - 1];
        prevSibling.children.push(node);
        onChange(newTree);

        const newPath = [...item.path.slice(0, -1), idx - 1, prevSibling.children.length - 1];
        setFocusedPath(pathKey(newPath));
    };

    const outdent = (item: FlatItem) => {
        // Move node up one level (make it a sibling of its parent)
        if (item.path.length <= 1) return; // root or direct child of root
        const newTree = cloneTree(treeData);
        const parent = getParentByPath(newTree, item.path)!;
        const grandparent = getParentByPath(newTree, item.path.slice(0, -1))!;
        const idx = item.path[item.path.length - 1];
        const parentIdx = item.path[item.path.length - 2];

        const node = parent.children.splice(idx, 1)[0];
        grandparent.children.splice(parentIdx + 1, 0, node);
        onChange(newTree);

        const newPath = [...item.path.slice(0, -2), parentIdx + 1];
        setFocusedPath(pathKey(newPath));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, item: FlatItem) => {
        if (readOnly) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addSibling(item);
        } else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            indent(item);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            outdent(item);
        } else if (e.key === 'Backspace' && item.node.label === '' && item.path.length > 0) {
            e.preventDefault();
            deleteNode(item);
        }
    };

    return (
        <div className="outliner">
            <div className="outliner-header">
                <span className="outliner-hint">
                    <kbd>Enter</kbd> adicionar · <kbd>Tab</kbd> indentar · <kbd>Shift+Tab</kbd> desindentar · <kbd>Backspace</kbd> remover vazio
                </span>
            </div>
            <div className="outliner-list">
                {items.map((item) => {
                    const key = pathKey(item.path);
                    const isRoot = item.path.length === 0;

                    return (
                        <div
                            key={item.node.id + '-' + key}
                            className={`outliner-item ${isRoot ? 'outliner-root' : ''}`}
                            style={{ paddingLeft: `${item.depth * 28 + 12}px` }}
                        >
                            <span className="outliner-bullet">
                                {isRoot ? '🌳' : item.node.children.length > 0 ? '▸' : '•'}
                            </span>
                            <div className="outliner-fields">
                                <input
                                    ref={(el) => {
                                        if (el) inputRefs.current.set(key, el);
                                    }}
                                    type="text"
                                    className="outliner-label"
                                    value={item.node.label}
                                    onChange={(e) => handleLabelChange(item, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item)}
                                    placeholder={isRoot ? 'Tema central...' : 'Tópico...'}
                                    readOnly={readOnly}
                                />
                                <input
                                    type="text"
                                    className="outliner-content"
                                    value={item.node.content}
                                    onChange={(e) => handleContentChange(item, e.target.value)}
                                    placeholder="Detalhes (opcional)"
                                    readOnly={readOnly}
                                />
                            </div>
                            {!readOnly && !isRoot && (
                                <button
                                    className="outliner-delete"
                                    onClick={() => deleteNode(item)}
                                    title="Remover"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {!readOnly && (
                <button
                    className="btn btn-sm btn-secondary outliner-add-root"
                    onClick={() => addChild({ node: treeData, depth: 0, path: [] })}
                >
                    + Adicionar tópico
                </button>
            )}
        </div>
    );
}
