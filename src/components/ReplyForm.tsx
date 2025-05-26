import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MoodSelector } from './MoodSelector';
import { supabase } from '@/lib/supabaseClient';
import type { ReplySubmission } from '@/types/threads';
import type { EchoMood } from '@/types/moods';

interface ReplyFormProps {
  parentEchoId: string;
  parentReplyId?: string;
  onReplySubmitted: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export function ReplyForm({ 
  parentEchoId, 
  parentReplyId, 
  onReplySubmitted, 
  onCancel,
  placeholder = "Share your thoughts on this echo..."
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<EchoMood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterLimit = 300;
  const isOverLimit = content.length > characterLimit;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('submit_echo_reply', {
        p_parent_echo_id: parentEchoId,
        p_parent_reply_id: parentReplyId || null,
        p_user_id: user.id,
        p_content: content.trim(),
        p_mood_id: selectedMood?.id || null
      });

      if (error) throw error;

      // Reset form
      setContent('');
      setSelectedMood(null);
      onReplySubmitted();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-400 resize-none focus:border-purple-500/50 focus:ring-purple-500/20"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between items-center text-sm">
          <span className={`${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
            {content.length}/{characterLimit}
          </span>
          {isOverLimit && (
            <span className="text-red-400 text-xs">
              Character limit exceeded
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mood (optional)
          </label>
          <MoodSelector
            selectedMood={selectedMood}
            onMoodSelect={setSelectedMood}
            variant="submit"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isEmpty || isOverLimit || isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/20"
          >
            {isSubmitting ? 'Replying...' : 'Reply'}
          </Button>
        </div>
      </div>
    </form>
  );
} 