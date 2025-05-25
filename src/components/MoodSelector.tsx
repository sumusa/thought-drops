import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import type { EchoMood } from '@/types/moods';

interface MoodSelectorProps {
  selectedMood?: EchoMood | null;
  onMoodSelect: (mood: EchoMood | null) => void;
  variant?: 'submit' | 'filter';
  className?: string;
}

export function MoodSelector({ 
  selectedMood, 
  onMoodSelect, 
  variant = 'submit',
  className = '' 
}: MoodSelectorProps) {
  const [moods, setMoods] = useState<EchoMood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const { data, error } = await supabase
        .from('echo_moods')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching moods:', error);
        return;
      }

      setMoods(data || []);
    } catch (error) {
      console.error('Error in fetchMoods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSubmitVariant = variant === 'submit';
  const isFilterVariant = variant === 'filter';

  return (
    <div className={`space-y-3 ${className}`}>
      {isSubmitVariant && (
        <div className="text-sm text-gray-400 mb-3">
          Choose a mood for your echo (optional):
        </div>
      )}
      
      {isFilterVariant && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">
            Filter by mood:
          </div>
          {selectedMood && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoodSelect(null)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Clear filter
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => {
          const isSelected = selectedMood?.id === mood.id;
          
          return (
            <Button
              key={mood.id}
              variant="outline"
              size="sm"
              onClick={() => onMoodSelect(isSelected ? null : mood)}
              className={`
                relative overflow-hidden transition-all duration-200 group
                ${isSelected 
                  ? 'bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-white' 
                  : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                }
              `}
              title={mood.description}
            >
              <span className="text-base mr-2">{mood.emoji}</span>
              <span className={`text-sm font-medium capitalize ${mood.color}`}>
                {mood.name}
              </span>
              
              {/* Shimmer effect for selected mood */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
            </Button>
          );
        })}
      </div>

      {isSubmitVariant && selectedMood && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{selectedMood.emoji}</span>
            <div>
              <div className={`font-medium capitalize ${selectedMood.color}`}>
                {selectedMood.name}
              </div>
              <div className="text-xs text-gray-400">
                {selectedMood.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 