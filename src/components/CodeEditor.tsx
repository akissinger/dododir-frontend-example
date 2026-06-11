import { useEffect, useRef } from 'preact/hooks';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

function languageExtension(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return ext === 'md' || ext === 'mdx' ? markdown() : [];
}

const baseExtensions = [
    lineNumbers(),
    history(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
    }),
];

interface Props {
    filename: string;
    content: string;
    onChange: (value: string) => void;
}

export function CodeEditor({ filename, content, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Debounce ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Flag to suppress onChange during programmatic content updates
    const isProgrammaticRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged && !isProgrammaticRef.current) {
                const value = update.state.doc.toString();
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => onChange(value), 500);
            }
        });

        const state = EditorState.create({
            doc: content,
            extensions: [...baseExtensions, languageExtension(filename), updateListener],
        });

        const view = new EditorView({ state, parent: containerRef.current });
        viewRef.current = view;

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            view.destroy();
            viewRef.current = null;
        };
        // Intentionally only re-mount when filename changes (language changes)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filename]);

    // Sync external content changes (e.g. switching tabs) without re-mounting
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (current !== content) {
            isProgrammaticRef.current = true;
            view.dispatch({
                changes: { from: 0, to: current.length, insert: content },
            });
            isProgrammaticRef.current = false;
        }
    }, [content]);

    return <div ref={containerRef} class="code-editor" />;
}
