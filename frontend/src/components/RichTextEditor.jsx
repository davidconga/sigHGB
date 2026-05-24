import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Undo, Redo, Strikethrough,
} from 'lucide-react'
import { useEffect } from 'react'

export default function RichTextEditor({ value, onChange, minHeight = 120 }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-content',
        style: `min-height: ${minHeight}px;`,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return null

  const Btn = ({ on, active, title, children }) => (
    <button
      type="button"
      onClick={on}
      title={title}
      className={`p-1.5 rounded text-slate-600 hover:bg-slate-100 ${active ? 'bg-hgb-100 text-hgb-700' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden bg-white focus-within:border-hgb-500 focus-within:ring-1 focus-within:ring-hgb-500">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-slate-50">
        <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito (Ctrl+B)"><Bold size={14}/></Btn>
        <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico (Ctrl+I)"><Italic size={14}/></Btn>
        <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado (Ctrl+U)"><UnderlineIcon size={14}/></Btn>
        <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Riscado"><Strikethrough size={14}/></Btn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List size={14}/></Btn>
        <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={14}/></Btn>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <Btn on={() => editor.chain().focus().undo().run()} title="Anular (Ctrl+Z)"><Undo size={14}/></Btn>
        <Btn on={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Y)"><Redo size={14}/></Btn>
      </div>
      <EditorContent editor={editor} className="px-3 py-2 text-sm prose-sm max-w-none focus:outline-none" />
    </div>
  )
}
