import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { EchoReactions } from './EchoReactions';
import { ReplyForm } from './ReplyForm';
import { EchoReplyItem } from './EchoReplyItem';
import { supabase } from '@/lib/supabaseClient';
import type { Echo } from '@/types/echo';
import type { EchoReply } from '@/types/threads';

interface EchoThreadProps {
  echo: Echo;
  onClose: () => void;
  onEchoUpdate: () => void;
}

export function EchoThread({ echo, onClose, onEchoUpdate }: EchoThreadProps) {
  const [replies, setReplies] = useState<EchoReply[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const loadReplies = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      setUser(currentUser);

      const { data, error } = await supabase.rpc('get_echo_thread', {
        p_echo_id: echo.id,
        p_user_id: currentUser.id
      });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReplies();
  }, [echo.id]);

  const handleReplySubmitted = () => {
    setShowReplyForm(false);
    loadReplies();
    onEchoUpdate(); // Update the main echo to reflect new reply count
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const participantCount = new Set(replies.map(r => r.anonymous_name)).size + 1; // +1 for original echo author

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              💬 Echo Thread
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Original Echo */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg p-6 border border-purple-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-300">Original Echo</span>
                {echo.mood_emoji && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{echo.mood_emoji}</span>
                    <span className={`text-xs ${echo.mood_color}`}>
                      {echo.mood_name}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(echo.created_at)}
              </span>
            </div>

            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap mb-4">
              {echo.content}
            </p>

            <div className="flex items-center justify-between">
              <EchoReactions 
                echoId={echo.id}
                userId={user?.id || ''}
                reactions={{
                  like_count: echo.like_count,
                  love_count: echo.love_count,
                  laugh_count: echo.laugh_count,
                  think_count: echo.think_count,
                  sad_count: echo.sad_count,
                  fire_count: echo.fire_count,
                }}
                userReactions={{
                  user_like_reaction: echo.user_like_reaction,
                  user_love_reaction: echo.user_love_reaction,
                  user_laugh_reaction: echo.user_laugh_reaction,
                  user_think_reaction: echo.user_think_reaction,
                  user_sad_reaction: echo.user_sad_reaction,
                  user_fire_reaction: echo.user_fire_reaction,
                }}
                onReactionChange={onEchoUpdate} 
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
              >
                💬 Reply to Echo
              </Button>
            </div>

            {/* Reply Form for Original Echo */}
            {showReplyForm && (
              <div className="mt-4">
                <ReplyForm
                  parentEchoId={echo.id}
                  onReplySubmitted={handleReplySubmitted}
                  onCancel={() => setShowReplyForm(false)}
                  placeholder="Share your thoughts on this echo..."
                />
              </div>
            )}
          </div>

          {/* Replies */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-2">Loading conversation...</p>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No replies yet. Be the first to join the conversation!</p>
              <Button
                onClick={() => setShowReplyForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/20"
              >
                💬 Start the Conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-300 mb-4">
                Conversation ({replies.length})
              </h3>
              {replies.map((reply) => (
                <EchoReplyItem
                  key={reply.id}
                  reply={reply}
                  onReactionChange={loadReplies}
                  onReplySubmitted={loadReplies}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 