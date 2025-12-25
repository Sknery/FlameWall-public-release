
import React, { useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { constructImageUrl } from '../utils/url';
import { cn } from '@/lib/utils';

const OLD_DEFAULT_BG = '#32383E';
const OLD_DEFAULT_TEXT = '#F0F4F8';

const getConditionDescription = (condition) => {
    if (condition.alias && condition.alias.trim() !== '') {
        return condition.alias;
    }

    if (!condition.target) return `Condition #${condition.index + 1}`;
    let base = condition.target.split(':')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (condition.specific_target) {
        const specific = condition.specific_target.split(':').pop().replace(/_/g, ' ');
        base += `: ${specific}`;
    }
    return base;
};

function AchievementCard({ achievement, isPreview = false, variant = 'default', className }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getProgressInfo = () => {
        if (isPreview) {
            const target = achievement.conditions?.conditions?.[0]?.count || 100;
            return { text: `0 / ${target}`, percent: 0 };
        }

        if (achievement.progress?.is_completed) {
            return { text: 'Completed!', percent: 100 };
        }

        const conditions = achievement.conditions?.conditions;
        const progressData = achievement.progress?.progress_data || {};
        const logic = achievement.conditions?.logic || 'AND';

        if (!conditions || conditions.length === 0) {
            return { text: 'N/A', noProgress: true };
        }

        if (conditions.length === 1) {
            const condition = conditions[0];
            const target = condition.count;
            const conditionKey = `condition_${condition.index}`;
            const current = progressData[conditionKey] || 0;
            return {
                text: `${current} / ${target}`,
                percent: target > 0 ? Math.min((current / target) * 100, 100) : 0,
            };
        }

        let conditionsMet = 0;
        const conditionDetails = [];

        conditions.forEach(condition => {
            const target = condition.count;
            const conditionKey = `condition_${condition.index}`;
            const current = progressData[conditionKey] || 0;
            const isMet = current >= target;
            if (isMet) conditionsMet++;
            conditionDetails.push({
                description: getConditionDescription(condition),
                current: Math.min(current, target),
                target,
                percent: target > 0 ? Math.min((current / target) * 100, 100) : 0,
                isMet,
            });
        });

        const tooltipContent = (
            <div className="p-2 space-y-3 min-w-[220px]">
                <p className="font-semibold text-sm border-b pb-1 mb-2 opacity-90">Requirements</p>
                {conditionDetails.map((detail, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs opacity-90">
                            <span>{detail.description}</span>
                            <span className="font-mono">{detail.current}/{detail.target}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all", detail.isMet ? "bg-green-500" : "bg-primary")}
                                style={{ width: `${detail.percent}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );

        const finalPercent = logic === 'OR'
            ? Math.max(...conditionDetails.map(d => d.percent))
            : (conditions.length > 0 ? (conditionsMet / conditions.length) * 100 : 0);

        return {
            text: logic === 'OR' ? 'Complete any condition' : `${conditionsMet} / ${conditions.length} done`,
            percent: finalPercent,
            tooltipContent,
        };
    };

    const progressInfo = getProgressInfo();
    const isCompleted = !isPreview && achievement.progress?.is_completed;

    const cardBg = (!achievement.card_color || achievement.card_color === OLD_DEFAULT_BG)
        ? 'hsl(var(--card))'
        : achievement.card_color;

    const cardText = (!achievement.text_color || achievement.text_color === OLD_DEFAULT_TEXT)
        ? 'hsl(var(--card-foreground))'
        : achievement.text_color;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "group relative flex flex-col w-full rounded-2xl overflow-hidden transition-all duration-300 ease-out",
                            "border border-white/5 ring-1 ring-white/5 shadow-sm",
                            variant === 'long' ? "min-h-[200px]" : "min-h-[160px]",
                            "min-w-[280px]",

                            "hover:shadow-xl hover:ring-white/10 hover:-translate-y-1",
                            isExpanded ? "ring-primary/30 shadow-primary/10 scale-[1.01] z-10" : "",

                            isCompleted ? "opacity-100" : "opacity-90 hover:opacity-100",
                            className
                        )}
                        style={{
                            backgroundColor: cardBg,
                            color: cardText
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

                        {isCompleted && (
                            <div className="absolute top-3 right-3 z-20">
                                <div className="bg-emerald-500/20 backdrop-blur-md p-1.5 rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>
                        )}

                        <CardContent className="relative z-10 p-5 flex flex-col h-full gap-4">
                            <div className="flex items-start gap-4">
                                <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-current blur-xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

                                    <Avatar className="h-16 w-16 rounded-2xl border-2 border-white/10 shadow-lg bg-black/20 backdrop-blur-sm p-1.5">
                                        {}
                                        <AvatarImage
                                            src={constructImageUrl(achievement.icon_url)}
                                            className="object-contain p-1"
                                        />
                                        <AvatarFallback className="rounded-2xl bg-transparent">
                                            {isCompleted ? <Award className="h-7 w-7 opacity-90" /> : <Lock className="h-7 w-7 opacity-50" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className={cn(
                                        "font-bold text-lg leading-tight pr-6 transition-all duration-300",
                                        isExpanded ? "whitespace-normal break-words" : "truncate group-hover:whitespace-normal group-hover:overflow-visible"
                                    )}>
                                        {achievement.name}
                                    </h3>

                                    <p className={cn(
                                        "text-xs font-medium opacity-70 mt-1.5 leading-relaxed transition-all duration-300",
                                        isExpanded ? "line-clamp-none" : "line-clamp-2 group-hover:line-clamp-none"
                                    )}>
                                        {achievement.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-2">
                                {!isCompleted && !progressInfo.noProgress && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Progress</span>
                                            <span className="text-xs font-bold opacity-90">{Math.round(progressInfo.percent)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                            <div
                                                className="h-full bg-current shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                                                style={{ width: `${progressInfo.percent}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-center opacity-60 font-medium mt-1 truncate">
                                            {progressInfo.text}
                                        </p>
                                    </div>
                                )}

                                {isCompleted && (
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-bold backdrop-blur-md shadow-sm text-emerald-100">
                                            Unlocked
                                        </div>
                                        {achievement.progress?.completed_at && (
                                            <span className="text-[10px] opacity-50 font-mono">
                                                {new Date(achievement.progress.completed_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </div>
                </TooltipTrigger>
                {progressInfo.tooltipContent && (
                    <TooltipContent side="bottom" className="bg-popover/95 backdrop-blur-xl border-border shadow-xl p-0 overflow-hidden rounded-xl">
                        {progressInfo.tooltipContent}
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

export default AchievementCard;