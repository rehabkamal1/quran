import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { storiesData } from '../data/storiesData';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ChevronDown, CheckCircle } from 'lucide-react';

export const Stories: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">قصص القرآن</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ</p>
      </div>

      <div className="space-y-6">
        {storiesData.map((story, index) => {
          const isExpanded = expandedId === story.id;
          
          return (
            <Card 
              key={story.id} 
              className={`p-0 overflow-hidden cursor-pointer transition-all duration-300 border-2 ${isExpanded ? 'border-primary/30 shadow-md' : 'border-transparent hover:border-black/5 dark:hover:border-white/5'}`}
              onClick={() => toggleExpand(story.id)}
            >
              {/* Header */}
              <div className="p-6 flex items-center justify-between gap-4 bg-gradient-to-l from-primary/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Book size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-primary dark:text-primary-light mb-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-text-muted">{story.surah}</p>
                  </div>
                </div>
                <ChevronDown 
                  size={24} 
                  className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} 
                />
              </div>

              {/* Story Content (Expanded State) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-black/5 dark:border-white/5 bg-white dark:bg-card-dark"
                  >
                    <div className="p-6 md:p-8 space-y-8">
                      {/* Story Text */}
                      <div className="text-lg leading-loose whitespace-pre-line text-justify">
                        {story.content}
                      </div>

                      {/* Lessons */}
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6">
                        <h4 className="font-bold text-xl text-primary mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                          الدروس المستفادة:
                        </h4>
                        <ul className="space-y-3">
                          {story.lessons.map((lesson, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle size={20} className="text-secondary shrink-0 mt-1" />
                              <span className="leading-relaxed">{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
