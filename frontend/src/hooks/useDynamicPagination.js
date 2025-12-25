import { useState, useLayoutEffect, useCallback } from 'react';
import { useMediaQuery } from './useMediaQuery';


const useDynamicPagination = (containerRef, itemHeight, options = {}) => {
    const { mobileFallback = 3, ready = true } = options;

    const [limit, setLimit] = useState(0);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const calculateLimit = useCallback(() => {
        if (isMobile) {
            setLimit(mobileFallback);
            return;
        }

        if (!containerRef.current || !itemHeight) {
            setLimit(1);
            return;
        }


        const containerHeight = containerRef.current.clientHeight;

        if (containerHeight > itemHeight) {

            const newLimit = Math.max(1, Math.floor(containerHeight / itemHeight));
            setLimit(newLimit);
        } else {

            setLimit(1);
        }
    }, [isMobile, containerRef, itemHeight, mobileFallback]);

    useLayoutEffect(() => {
        if (!ready) {
            setLimit(0);
            return;
        }

        const timeoutId = setTimeout(calculateLimit, 100);

        const element = containerRef.current;
        const resizeObserver = new ResizeObserver(calculateLimit);

        if (element) {
            resizeObserver.observe(element);
        }

        return () => {
            clearTimeout(timeoutId);
            if (element) {

                resizeObserver.unobserve(element);
            }
        };
    }, [ready, calculateLimit, containerRef]);

    return limit;
};

export default useDynamicPagination;

