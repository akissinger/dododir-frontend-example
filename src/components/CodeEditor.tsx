import { useEffect, useRef } from 'preact/hooks';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, highlightSpecialChars, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';

function languageExtension(filename: string): Extension {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'js':
        case 'mjs':
        case 'cjs':
            return javascript();
        case 'ts':
        case 'mts':
        case 'cts':
            return javascript({ typescript: true });
        case 'jsx':
            return javascript({ jsx: true });
        case 'tsx':
            return javascript({ typescript: true, jsx: true });
        case 'css':
        case 'scss':
        case 'less':
            return css();
        case 'html':
        case 'htm':
            return html();
        case 'json':
        case 'jsonc':
            return json();
        case 'md':
        case 'mdx':
            return markdown();
        case 'py':
            return python();
        default:
            return [];
    }
}

const baseExtensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
    ]),
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
