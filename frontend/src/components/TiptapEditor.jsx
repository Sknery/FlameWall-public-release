
import React, { useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { constructImageUrl } from '@/utils/url';
import toast from 'react-hot-toast';


import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Baseline, Link as LinkIcon, Link2Off,
    AlignLeft, AlignCenter, AlignRight, Pilcrow, List, ListOrdered, Minus, Image as ImageIcon, Quote
} from 'lucide-react';


import StarterKit from '@tiptap/starter-kit';
import CustomImageExtension from '@/tiptap-extensions/CustomImageExtension';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

const MenuBar = ({ editor }) => {
    const { authToken } = useAuth();

    const addImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            const toastId = toast.loading('Uploading image...');

            try {
                const response = await axios.post('/api/media/editor-image', formData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                toast.loading('Processing image...', { id: toastId });
                const relativeUrl = response.data.url;
                if (relativeUrl) {
                    const fullUrl = constructImageUrl(relativeUrl);
                    editor.chain().focus().setImage({ src: fullUrl, width: '500px' }).run();
                    toast.success('Image inserted!', { id: toastId });
                }
            } catch (error) {
                console.error('Image upload failed:', error);
                toast.error('Image upload failed!', { id: toastId });
            }
        };
        input.click();
    }, [editor, authToken]);

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
            <Toggle size="sm" type="button" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()}><Highlighter className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8" />

            <Toggle size="sm" type="button" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8" />

            <Toggle size="sm" type="button" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8" />

            <Toggle size="sm" type="button" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>
            <Toggle size="sm" type="button" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Toggle>

            <Separator orientation="vertical" className="h-8" />

            <Button variant="ghost" size="icon" className="h-8 w-8" type="button" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button" onClick={setLink}><LinkIcon className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}><Link2Off className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Button>

            <div className="relative inline-block">
                <Button variant="ghost" size="icon" className="h-8 w-8" type="button"><Baseline className="h-4 w-4" /></Button>
                <input type="color" onInput={(event) => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#ffffff'} className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" />
            </div>
        </div>
    );
};

export const TiptapEditor = ({ content, onChange, ...props }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            CustomImageExtension,
            TextAlign.configure({ types: ['heading', 'paragraph', 'customImage'] }),
            TextStyle, Color, FontFamily,
            Link.configure({ openOnClick: false, autolink: true }),
            Underline, Highlight.configure({ multicolor: true }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base prose-invert max-w-none focus:outline-none p-4',
                style: `min-height: 250px;`,
            },
        },
        ...props,
    });

  return (
        <div className="rounded-md border border-input bg-transparent flex flex-col flex-1 min-h-0">
            {editor && (
              <BubbleMenu
                editor={editor}
                shouldShow={({ editor }) => editor.isActive('customImage')}
                tippyOptions={{ duration: 100, placement: 'top' }}
                className="flex gap-1 rounded-md border bg-background p-1"
              >
                <Button type="button" size="sm" variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('left').run()}>Align Left</Button>
                <Button type="button" size="sm" variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('center').run()}>Align Center</Button>
                <Button type="button" size="sm" variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('right').run()}>Align Right</Button>
              </BubbleMenu>
            )}
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};