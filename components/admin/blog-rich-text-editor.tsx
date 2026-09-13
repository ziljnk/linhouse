"use client"

import type { ReactNode } from "react"
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const EDITOR_CLASS = cn(
  "min-h-[280px] px-4 py-3 text-sm outline-none",
  "[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_p]:my-2 [&_p]:leading-relaxed",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
  "[&_p.is-editor-empty:first-child]:before:float-left",
  "[&_p.is-editor-empty:first-child]:before:h-0",
  "[&_p.is-editor-empty:first-child]:before:text-muted-foreground",
  "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
)

function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(pressed && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  )
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      underline: instance.isActive("underline"),
      strike: instance.isActive("strike"),
      h2: instance.isActive("heading", { level: 2 }),
      h3: instance.isActive("heading", { level: 3 }),
      bullet: instance.isActive("bulletList"),
      ordered: instance.isActive("orderedList"),
      quote: instance.isActive("blockquote"),
      link: instance.isActive("link"),
    }),
  })

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Nhập liên kết", previous ?? "https://")
    if (url === null) return
    const next = url.trim()
    if (next === "") {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <ToolbarButton
        label="In đậm"
        pressed={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="In nghiêng"
        pressed={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch chân"
        pressed={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch ngang"
        pressed={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        label="Tiêu đề 2"
        pressed={state.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Tiêu đề 3"
        pressed={state.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        label="Danh sách"
        pressed={state.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách số"
        pressed={state.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Trích dẫn"
        pressed={state.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton label="Chèn liên kết" pressed={state.link} onClick={setLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Gỡ liên kết"
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton label="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Làm lại" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </ToolbarButton>
    </div>
  )
}

export function BlogRichTextEditor({
  initialContent = "",
  onChange,
}: {
  initialContent?: string
  onChange?: (html: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
      Placeholder.configure({
        placeholder: "Viết nội dung bài viết...",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
        "aria-label": "Nội dung bài viết",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange?.(instance.getHTML())
    },
  })

  if (!editor) {
    return (
      <div className="min-h-85 rounded-md border border-input bg-transparent shadow-xs" />
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
