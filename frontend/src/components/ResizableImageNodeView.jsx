

import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
export const ResizableImageNodeView = ({ node, updateAttributes }) => {
  const { src, alt, title, textAlign, width } = node.attrs;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const newWidth = containerRef.current.style.width;
          if (newWidth && newWidth !== node.attrs.width) {
            updateAttributes({ width: newWidth });
          }
        }
      });
    });
    observer.observe(containerRef.current, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [updateAttributes, node.attrs.width]);

  return (
    <NodeViewWrapper
      as="div"
      data-align={textAlign}
    >
      <span
        ref={containerRef}
        className="resizable-image-container-native"
        style={{ width: width }}
      >
        <img src={src} alt={alt} title={title} className="resizable-image" draggable="false" />
      </span>
    </NodeViewWrapper>

  );
};