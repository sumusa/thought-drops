import { useState } from 'react';
import { Button } from './ui/button';
import { ReplyReactions } from './ReplyReactions';
import { ReplyForm } from './ReplyForm';
import type { EchoReply } from '@/types/threads';

interface EchoReplyItemProps {
  reply: EchoReply;
  onReactionChange: () => void;
  onReplySubmitted: () => void;
}

export function EchoReplyItem({ reply, onReactionChange, onReplySubmitted }: EchoReplyItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleReplySubmitted = () => {
    setShowReplyForm(false);
    onReplySubmitted();
  };

  // Calculate indentation based on thread depth (max 5 levels)
  const indentationLevel = Math.min(reply.thread_depth, 5);
  const marginLeft = indentationLevel * 24; // 24px per level

  return (
    <div 
      className="border-l-2 border-gray-700/30 pl-4 py-3"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="bg-gray-800/20 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
        {/* Reply Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${reply.anonymous_color}`}>
              {reply.anonymous_name}
            </span>
            {reply.mood_emoji && (
              <div className="flex items-center gap-1">
                <span className="text-sm">{reply.mood_emoji}</span>
                <span className={`text-xs ${reply.mood_color}`}>
                  {reply.mood_name}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {formatTimeAgo(reply.created_at)}
          </span>
        </div>

        {/* Reply Content */}
        <div className="mb-3">
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
        </div>

        {/* Reply Actions */}
        <div className="flex items-center justify-between">
          <ReplyReactions 
            reply={reply} 
            onReactionChange={onReactionChange} 
          />
          
          {reply.thread_depth < 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 text-xs"
            >
              💬 Reply
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4">
            <ReplyForm
              parentEchoId={reply.parent_echo_id}
              parentReplyId={reply.id}
              onReplySubmitted={handleReplySubmitted}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${reply.anonymous_name}...`}
            />
          </div>
        )}
      </div>
    </div>
  );
} 