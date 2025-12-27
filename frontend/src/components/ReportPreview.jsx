import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, MessageSquare, FileText, Newspaper } from 'lucide-react';
import { constructImageUrl } from '../utils/url';
import RenderedHtmlContent from './RenderedHtmlContent';

const ReportPreview = ({ ticket }) => {
  if (!ticket.reportEntityType || !ticket.reportEntityId) {
    return null;
  }

  let entityData = null;
  try {
    entityData = ticket.reportEntityData ? JSON.parse(ticket.reportEntityData) : null;
  } catch (e) {
    console.error('Failed to parse report entity data:', e);
    return null;
  }

  if (!entityData) {
    return null;
  }

  const getEntityUrl = () => {
    switch (ticket.reportEntityType) {
      case 'POST':
        return `/posts/${ticket.reportEntityId}`;
      case 'COMMENT':
        return `/posts/${entityData.postId}#comment-${ticket.reportEntityId}`;
      case 'NEWS':
        return `/news/${ticket.reportEntityId}`;
      case 'USER':
        return `/users/${entityData.profile_slug || ticket.reportEntityId}`;
      default:
        return null;
    }
  };

  const getEntityIcon = () => {
    switch (ticket.reportEntityType) {
      case 'POST':
        return <FileText className="h-4 w-4" />;
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4" />;
      case 'NEWS':
        return <Newspaper className="h-4 w-4" />;
      case 'USER':
        return <User className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const url = getEntityUrl();
  if (!url) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getEntityIcon()}
            <span className="text-sm font-semibold">
              Reported {ticket.reportEntityType}
            </span>
          </div>
          {url && (
            <Button variant="outline" size="sm" asChild>
              <RouterLink to={url} target="_blank">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Original
              </RouterLink>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {/* Post Preview */}
          {ticket.reportEntityType === 'POST' && (
            <div className="space-y-2">
              {entityData.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={constructImageUrl(entityData.author.pfp_url)} />
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{entityData.author.username || 'Anonymous'}</span>
                </div>
              )}
              {entityData.title && (
                <h3 className="font-semibold text-sm">{entityData.title}</h3>
              )}
              {entityData.content && (
                <div className="text-xs text-muted-foreground line-clamp-3">
                  <RenderedHtmlContent htmlContent={entityData.content} />
                </div>
              )}
            </div>
          )}

          {/* Comment Preview */}
          {ticket.reportEntityType === 'COMMENT' && (
            <div className="space-y-2">
              {entityData.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={constructImageUrl(entityData.author.pfp_url)} />
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{entityData.author.username || 'Anonymous'}</span>
                </div>
              )}
              {entityData.content && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {entityData.content}
                </p>
              )}
              {entityData.postTitle && (
                <p className="text-xs text-muted-foreground italic">
                  In post: {entityData.postTitle}
                </p>
              )}
            </div>
          )}

          {/* News Preview */}
          {ticket.reportEntityType === 'NEWS' && (
            <div className="space-y-2">
              {entityData.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={constructImageUrl(entityData.author.pfp_url)} />
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{entityData.author.username || 'System'}</span>
                </div>
              )}
              {entityData.name && (
                <h3 className="font-semibold text-sm">{entityData.name}</h3>
              )}
              {entityData.desc && (
                <div className="text-xs text-muted-foreground line-clamp-3">
                  <RenderedHtmlContent htmlContent={entityData.desc} />
                </div>
              )}
            </div>
          )}

          {/* User Preview */}
          {ticket.reportEntityType === 'USER' && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={constructImageUrl(entityData.pfp_url)} />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{entityData.username || 'Unknown User'}</p>
                {entityData.rank && (
                  <p className="text-xs text-muted-foreground">{entityData.rank.name}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportPreview;

