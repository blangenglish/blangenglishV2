import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bold, Italic, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  Link as LinkIcon,
  Undo, Redo,
  UnderlineIcon,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Inline Underline mark (no external dep needed)
import { Mark, mergeAttributes } from '@tiptap/core';

const UnderlineMark = Mark.create({
  name: 'underline',
  parseHTML() { return [{ tag: 'u' }, { style: 'text-decoration=underline' }]; },
  renderHTML({ HTMLAttributes }) { return ['u', mergeAttributes(HTMLAttributes), 0]; },
  addKeyboardShortcuts() {
    return { 'Mod-u': () => this.editor.commands.toggleMark(this.name) };
  },
});

// Inline Color mark via textStyle
import { Extension } from '@tiptap/core';

const ColorExtension = Extension.create({
  name: 'colorExtension',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        color: {
          default: null,
          parseHTML: el => el.style.color || null,
          renderHTML: attrs => attrs.color ? { style: `color: ${attrs.color}` } : {},
        },
      },
    }];
  },
});

function ToolbarButton({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0 shrink-0"
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({ content, onChange, placeholder = 'Escribe aquí...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineMark,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      TextStyle,
      ColorExtension,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { color }).run();
  }, [editor]);

  if (!editor) return null;

  const COLORS = ['#000000', '#ffffff', '#9333ea', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <Card className="overflow-hidden border-border">
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap items-center gap-0.5">
        {/* Format */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleMark('underline').run()} active={editor.isActive('underline')} title="Subrayado (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Color de texto">
              <div className="relative">
                <span className="text-xs font-bold" style={{ color: editor.getAttributes('textStyle').color || '#000' }}>A</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }} />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Color de texto</p>
            <Input type="color" value={editor.getAttributes('textStyle').color || '#000000'} onChange={e => setColor(e.target.value)} className="h-8 w-full mb-2 cursor-pointer" />
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map(c => (
                <button key={c} type="button" title={c} className="h-7 w-7 rounded border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Link */}
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Insertar enlace">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer (Ctrl+Z)">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer (Ctrl+Y)">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="min-h-[200px] bg-background text-foreground [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-4 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline"
      />
    </Card>
  );
}
