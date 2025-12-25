import React, { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';
import { Plus, ZoomIn, ZoomOut, Move, Lock, CheckCircle2, Trophy, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import AchievementCard from './AchievementCard';
import { constructImageUrl } from '../utils/url';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const TreeNode = memo(({
    achievement,
    allAchievements,
    onSelect,
    onAddChild,
    isEditorMode
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    let children = [];
    if (achievement.id === 'virtual_root') {
        children = allAchievements.filter(a => !a.parent_id);
    } else {
        children = allAchievements.filter(a => a.parent_id === achievement.id);
    }

    const isCompleted = achievement.progress?.is_completed || achievement.id === 'virtual_root';
    const isVirtualRoot = achievement.id === 'virtual_root';

    const handleNodeClick = (e) => {
        e.stopPropagation();
        if (isVirtualRoot && !isEditorMode) return;
        if (window.matchMedia('(hover: none)').matches) {
            if (!isTouched) {
                setIsTouched(true);
                return;
            }
        }
        onSelect(achievement);
    };

    const lineColor = "bg-white/20";

    return (
        <div className="flex items-center">
            {}
            <div
                id={isVirtualRoot ? "tree-root-node" : undefined}
                className="flex flex-col items-center z-10 group relative py-2"
            >
                <TooltipProvider delayDuration={0}>
                    <Tooltip open={(!isVirtualRoot && (isHovered || isTouched))}>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "relative w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xl backdrop-blur-md z-20",
                                    isVirtualRoot
                                        ? "bg-gradient-to-br from-violet-600/20 to-indigo-900/40 border-violet-500/50 shadow-violet-500/20 w-24 h-24 rounded-full"
                                        : isCompleted
                                            ? "bg-green-500/10 border-green-500/50 shadow-green-500/20"
                                            : "bg-card/80 border-white/10 hover:border-primary hover:shadow-primary/20",
                                    (isHovered || isTouched) && !isVirtualRoot ? "scale-110 ring-2 ring-white/20" : "scale-100"
                                )}
                                onClick={handleNodeClick}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => { setIsHovered(false); setIsTouched(false); }}
                            >
                                {isVirtualRoot ? (
                                     <MapPin className="w-10 h-10 text-violet-200 drop-shadow-lg" />
                                ) : (
                                    <Avatar className="w-10 h-10 md:w-12 md:h-12 rounded-none bg-transparent">
                                        <AvatarImage src={constructImageUrl(achievement.icon_url)} className="object-contain drop-shadow-md" />
                                        <AvatarFallback className="bg-transparent">
                                            {isCompleted ? <Trophy className="w-8 h-8 text-yellow-500" /> : <Lock className="w-8 h-8 text-muted-foreground/50" />}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                {!isVirtualRoot && isCompleted && (
                                    <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 border border-green-500 shadow-sm z-30">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                )}

                                {isEditorMode && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className={cn(
                                            "absolute w-6 h-6 rounded-full shadow-md transition-all z-30 border border-white/20",
                                            isVirtualRoot ? "-bottom-3 right-1/2 translate-x-1/2" : "-bottom-2 -right-2 opacity-0 group-hover:opacity-100"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddChild(isVirtualRoot ? null : achievement.id);
                                        }}
                                        title={isVirtualRoot ? "Add Root Achievement" : "Add Child Branch"}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </TooltipTrigger>

                        {!isVirtualRoot && (
                            <TooltipContent
                                side="right"
                                className="p-0 border-none bg-transparent shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50"
                                sideOffset={24}
                            >
                                <div className="w-[300px] md:w-[340px]">
                                    <AchievementCard achievement={achievement} isPreview={isEditorMode} />
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                {isVirtualRoot && (
                    <div className="absolute -bottom-8 font-bold text-violet-200 tracking-wide text-sm drop-shadow-md whitespace-nowrap">
                        START
                    </div>
                )}
            </div>

            {}
            {children.length > 0 && (
                <>
                    {}
                    <div className={cn("w-12 h-0.5 shrink-0", lineColor)} />

                    {}
                    <div className="flex flex-col justify-center">
                        {children.map((child, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === children.length - 1;
                            const isSingle = children.length === 1;

                            return (
                                <div key={child.id} className="flex items-center">
                                    {}
                                    <div className="relative w-8 self-stretch flex flex-col justify-center">

                                        {}
                                        {!isSingle && (
                                            <div className={cn(
                                                "absolute left-0 w-0.5 bg-white/20",
                                                isFirst ? "top-1/2 h-1/2" :
                                                isLast ? "top-0 h-1/2" : "top-0 h-full"
                                            )} />
                                        )}

                                        {}
                                        <div className={cn(
                                            "h-0.5 w-full bg-white/20",
                                            !isSingle && isFirst ? "rounded-tl-full" : "",
                                            !isSingle && isLast ? "rounded-bl-full" : ""
                                        )} />
                                    </div>

                                    {}
                                    <TreeNode
                                        achievement={child}
                                        allAchievements={allAchievements}
                                        onSelect={onSelect}
                                        onAddChild={onAddChild}
                                        isEditorMode={isEditorMode}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
});

const AchievementTree = ({ achievements, onNodeSelect, onAddNode, isEditorMode = false }) => {
    const transformRef = useRef({ x: 0, y: 0, scale: 1 });
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastTouchDist = useRef(0);
    const isInitialized = useRef(false);

    const virtualRoot = {
        id: 'virtual_root',
        name: 'Start',
        progress: { is_completed: true }
    };

    const updateTransform = () => {
        if (contentRef.current) {
            const { x, y, scale } = transformRef.current;
            contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        }
        if (containerRef.current) {
            const { x, y, scale } = transformRef.current;
            containerRef.current.style.backgroundPosition = `${x}px ${y}px`;
            containerRef.current.style.backgroundSize = `${24 * scale}px ${24 * scale}px`;
        }
    };

    const zoomToPoint = (zoomDelta, centerX, centerY) => {
        const { x, y, scale } = transformRef.current;
        const newScale = Math.min(Math.max(scale + zoomDelta, 0.2), 3);

        const scaleRatio = newScale / scale;
        const newX = centerX - (centerX - x) * scaleRatio;
        const newY = centerY - (centerY - y) * scaleRatio;

        transformRef.current = { x: newX, y: newY, scale: newScale };
        updateTransform();
    };

    const centerOnRoot = () => {
        if (!containerRef.current || !contentRef.current) return;

        const rootElement = contentRef.current.querySelector('#tree-root-node');

        if (rootElement) {
            const { clientWidth: containerW, clientHeight: containerH } = containerRef.current;

            let el = rootElement;
            let x = 0;
            let y = 0;

            x += el.offsetWidth / 2;
            y += el.offsetHeight / 2;

            while (el && el !== contentRef.current) {
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            }

            const initialX = containerW / 2 - x;
            const initialY = containerH / 2 - y;

            transformRef.current = { x: initialX, y: initialY, scale: 1 };
            updateTransform();
        }
    };

    useLayoutEffect(() => {
        if (!isInitialized.current && containerRef.current) {
            setTimeout(() => {
                centerOnRoot();
                isInitialized.current = true;
            }, 100);        }
    }, []);

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('[role="tooltip"]')) return;
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        updateTransform();
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomIntensity = 0.1;
            const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;

            zoomToPoint(delta, mouseX, mouseY);
        } else {
            e.preventDefault();
            transformRef.current.x -= e.deltaX;
            transformRef.current.y -= e.deltaY;
            updateTransform();
        }
    };

    const handleTouchStart = (e) => {
        if (e.target.closest('button') || e.target.closest('[role="tooltip"]')) return;
        if (e.touches.length === 1) {
            isDragging.current = true;
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            isDragging.current = false;
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastTouchDist.current = dist;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 1 && isDragging.current) {
            const dx = e.touches[0].clientX - lastMousePos.current.x;
            const dy = e.touches[0].clientY - lastMousePos.current.y;
            transformRef.current.x += dx;
            transformRef.current.y += dy;
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            updateTransform();
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

            const deltaDist = dist - lastTouchDist.current;
            const zoomSpeed = 0.005;
            const zoomDelta = deltaDist * zoomSpeed;

            zoomToPoint(zoomDelta, centerX, centerY);
            lastTouchDist.current = dist;
        }
    };

    const handleTouchEnd = () => { isDragging.current = false; };

    useEffect(() => {
        const el = containerRef.current;
        if (el) el.addEventListener('wheel', handleWheel, { passive: false });
        return () => { if (el) el.removeEventListener('wheel', handleWheel); };
    }, []);

    const handleZoomBtn = (direction) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        zoomToPoint(direction * 0.3, centerX, centerY);
    };

    return (
        <div
            className="relative w-full h-full bg-[#09090b] rounded-xl overflow-hidden border border-white/10 shadow-inner select-none touch-none"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                cursor: 'grab',
                backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}
        >
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
                <Button variant="secondary" size="icon" onClick={() => handleZoomBtn(1)} className="h-10 w-10 shadow-xl bg-card/90 backdrop-blur border-white/10"><ZoomIn className="h-5 w-5" /></Button>
                <Button variant="secondary" size="icon" onClick={centerOnRoot} className="h-10 w-10 shadow-xl bg-card/90 backdrop-blur border-white/10"><Move className="h-5 w-5" /></Button>
                <Button variant="secondary" size="icon" onClick={() => handleZoomBtn(-1)} className="h-10 w-10 shadow-xl bg-card/90 backdrop-blur border-white/10"><ZoomOut className="h-5 w-5" /></Button>
            </div>

            <div
                ref={contentRef}
                className="absolute w-full h-full origin-top-left will-change-transform"
            >
                {}
                <div className="inline-flex items-center p-40">
                     <TreeNode
                        achievement={virtualRoot}
                        allAchievements={achievements}
                        onSelect={onNodeSelect}
                        onAddChild={onAddNode}
                        isEditorMode={isEditorMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default AchievementTree;