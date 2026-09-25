import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import CodeMirror, { EditorView, Prec } from '@uiw/react-codemirror';
import { cn } from 'cn';
import type { Theme } from '@/lib/theme';

// Blend into the card: no editor or gutter background of its own, the card's border colour between them.
const blend = Prec.highest(
  EditorView.theme({
    '&': { backgroundColor: 'transparent' },
    '.cm-gutters': { backgroundColor: 'transparent', borderRight: '1px solid var(--border)' },
    '.cm-activeLineGutter, .cm-activeLine': {
      backgroundColor: 'color-mix(in oklch, var(--foreground) 5%, transparent)',
    },
  })
);

const editable = [json(), lintGutter(), linter(jsonParseLinter()), blend];
const readOnly = [json(), blend];

interface JsonEditorProps {
  value: string;
  theme: Theme;
  onChange?: (value: string) => void;
  className?: string;
  label: string;
}

/** CodeMirror JSON editor; read-only without `onChange`. It fills its container's height. */
export const JsonEditor = ({ value, theme, onChange, className, label }: JsonEditorProps) => (
  <CodeMirror
    value={value}
    theme={theme}
    height="100%"
    aria-label={label}
    className={cn('overflow-hidden rounded-md border text-xs [&_.cm-editor]:h-full', className)}
    extensions={onChange ? editable : readOnly}
    editable={Boolean(onChange)}
    readOnly={!onChange}
    basicSetup={{ foldGutter: true, highlightActiveLine: Boolean(onChange) }}
    {...(onChange ? { onChange } : {})}
  />
);
