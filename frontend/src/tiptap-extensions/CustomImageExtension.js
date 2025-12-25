import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageNodeView } from '../components/ResizableImageNodeView';
import { mergeAttributes } from '@tiptap/core';

const CustomImageExtension = Image.extend({
  name: 'customImage',
  group: 'block',
  inline: false,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
      },
      textAlign: {
        default: 'center',
        renderHTML: () => ({}),
        parseHTML: element => element.parentElement?.getAttribute('data-align') || 'center',
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const customAttrs = {
        class: 'image-align-wrapper',
        'data-align': node.attrs.textAlign,
        'data-image-wrapper': '',
    };

    return [
      'div',
      mergeAttributes(HTMLAttributes, customAttrs),
      ['img', {
        src: node.attrs.src,
        alt: node.attrs.alt,
        title: node.attrs.title,
        style: `width: ${node.attrs.width}; height: auto;`,
       }],
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-image-wrapper]',
        getAttrs: (dom) => {
          const div = dom;
          const img = div.querySelector('img');
          if (!img) return false;

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.style.width || 'auto',
            textAlign: div.getAttribute('data-align') || 'center',
          };
        },
      },
      {
        tag: 'img[src]:not([src^="data:"])',
        getAttrs: domNode => {
          if (domNode.parentElement?.hasAttribute('data-image-wrapper')) {
            return false;
          }
          return {
            src: domNode.getAttribute('src'),
            alt: domNode.getAttribute('alt'),
            title: domNode.getAttribute('title'),
            width: domNode.style.width || domNode.getAttribute('width') || 'auto',
            height: domNode.style.height || domNode.getAttribute('height') || 'auto',
            textAlign: 'center',
          };
        }
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

export default CustomImageExtension;

