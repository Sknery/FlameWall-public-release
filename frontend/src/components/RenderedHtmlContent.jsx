import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';


function RenderedHtmlContent({ htmlContent, className }) {

    const processedHtml = useMemo(() => {
        if (typeof window === 'undefined' || !htmlContent) {
            return htmlContent || '';
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const legacyImages = Array.from(tempDiv.querySelectorAll('img')).filter(
            img => img.parentElement.getAttribute('data-image-wrapper') !== ''
        );

        legacyImages.forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-image-wrapper', '');
            wrapper.setAttribute('data-align', 'center');            wrapper.className = 'image-align-wrapper';

            const originalParent = img.parentElement;

            if (originalParent && originalParent.tagName === 'P' && originalParent.textContent.trim() === '' && originalParent.children.length === 1) {
                originalParent.parentElement.replaceChild(wrapper, originalParent);
                wrapper.appendChild(img);            } else {
                originalParent.replaceChild(wrapper, img);
                wrapper.appendChild(img);            }
        });

        return tempDiv.innerHTML;
    }, [htmlContent]);

    if (!processedHtml) {
        return null;
    }

    return (
        <div
            className={cn("prose prose-lg prose-invert max-w-none break-words", className)}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
            style={{
                '--tw-prose-bullets': 'hsl(var(--foreground) / 0.5)',
            }}
        />
    );
}

export default RenderedHtmlContent;

