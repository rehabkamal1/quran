import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, CheckCircle2, Loader2, Play, Pause, Square, Settings, Music } from 'lucide-react';
import { adhkarApi } from '../services/adhkarApi';
import type { Dhikr } from '../services/adhkarApi';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService, ADHAKAR_RECITERS } from '../services/audioService';

// Text-to-Audio-ID mapping helper functions for Hisn Al-Muslim audios (Faris Abbad)
const getMorningAudioId = (text: string): number | null => {
  if (text.includes("اللَّهُ لَا إِلَهَ إِلَّا هُوَ") || text.includes("اللّه لا إله إلا هو الحي القيوم")) return 75;
  if (text.includes("قُلْ هُوَ اللَّهُ أَحَدٌ") || text.includes("قُلْ هُوَ اللهُ أَحَد")) return 76;
  if (text.includes("أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ") || text.includes("أَصْـبَحْنا وَأَصْـبَحَ")) return 77;
  if (text.includes("اللَّهُمَّ بِكَ أَصْبَحْنَا") || text.includes("اللّهُـمَّ بِكَ أَصْـبَحْنا")) return 78;
  if (text.includes("أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ") || text.includes("أَنْتَ رَبِّـي لا إلهَ إِلاّ أَنْتَ")) return 79;
  if (text.includes("أَصْبَحْتُ أُشْهِدُكَ") || text.includes("أَصْبَـحْتُ أُشْـهِدُك")) return 80;
  if (text.includes("مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ") || text.includes("ما أَصْبَـحَ بي مِـنْ نِعْـمَةٍ")) return 81;
  if (text.includes("اللَّهُمَّ عَافِنِي فِي بَدَنِي") || text.includes("اللّهُـمَّ عافِـني في بَدَنـي")) return 82;
  if (text.includes("حَسْبِيَ اللَّهُ لَا إِلَهَ") || text.includes("حَسْبِـيَ اللّهُ لا إلهَ")) return 83;
  if (text.includes("أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ") || text.includes("أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ")) return 84;
  if (text.includes("عَالِمَ الْغَيْبِ") || text.includes("عالِـمَ الغَـيْبِ")) return 85;
  if (text.includes("بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ") || text.includes("بِسـمِ اللهِ الذي لا يَضُـرُّ")) return 86;
  if (text.includes("رَضِيتُ بِاللَّهِ رَبًّا") || text.includes("رَضيـتُ بِاللهِ")) return 87;
  if (text.includes("يَا حَيُّ يَا قَيُّومُ") || text.includes("يَا حَيُّ يَا قيُّومُ")) return 88;
  if (text.includes("أَصْبَحْنَا عَلَى فِطْرَةِ") || text.includes("أَصْبَـحْـنا عَلَى فِطْرَةِ")) return 89;
  if (text.includes("سُبْحَانَ اللَّهِ وَبِحَمْدِهِ") && text.includes("عَدَدَ خَلْقِهِ")) return 92;
  if (text.includes("سُبْحَانَ اللَّهِ وَبِحَمْدِهِ")) return 90;
  if (text.includes("لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ") || text.includes("لا إلهَ إلاّ اللّهُ وحْدَهُ")) return 91;
  if (text.includes("عِلْمًا نَافِعًا")) return 93;
  if (text.includes("أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ")) return 94;
  if (text.includes("أَعُوذُ بِكَلِمَاتِ اللَّهِ")) return 95;
  if (text.includes("اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا")) return 96;
  return null;
};

const getEveningAudioId = (text: string): number | null => {
  if (text.includes("اللَّهُ لَا إِلَهَ إِلَّا هُوَ") || text.includes("اللّه لا إله إلا هو الحي القيوم")) return 75;
  if (text.includes("قُلْ هُوَ اللَّهُ أَحَدٌ") || text.includes("قُلْ هُوَ اللهُ أَحَد")) return 76;
  if (text.includes("أَمْسَيْنَا وَأَمْسَى الْمُلْكُ") || text.includes("أَمْسَيْـنا وَأَمْسـى")) return 77;
  if (text.includes("اللَّهُمَّ بِكَ أَمْسَيْنَا") || text.includes("اللّهُـمَّ بِكَ أَمْسَـينا")) return 78;
  if (text.includes("أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ") || text.includes("أَنْتَ رَبِّـي لا إلهَ إِلاّ أَنْتَ")) return 79;
  if (text.includes("أَمْسَيْتُ أُشْهِدُكَ") || text.includes("أَمسيتُ أُشْـهِدُك")) return 80;
  if (text.includes("مَا أَمْسَى بي مِنْ نِعْمَةٍ") || text.includes("ما أَمسى بي مِـنْ نِعْـمَةٍ")) return 81;
  if (text.includes("اللَّهُمَّ عَافِنِي فِي بَدَنِي") || text.includes("اللّهُـمَّ عافِـني في بَدَنـi") || text.includes("اللّهُـمَّ عافِـني في بَدَنـي")) return 82;
  if (text.includes("حَسْبِيَ اللَّهُ لَا إِلَهَ") || text.includes("حَسْبِـيَ اللّهُ لا إلهَ")) return 83;
  if (text.includes("أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ") || text.includes("أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ")) return 84;
  if (text.includes("عَالِمَ الْغَيْبِ") || text.includes("عالِـمَ الغَـيْبِ")) return 85;
  if (text.includes("بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ") || text.includes("بِسـمِ -اللهِ الذي لا يَضُـرُّ") || text.includes("بِسـمِ اللهِ الذي لا يَضُـرُّ")) return 86;
  if (text.includes("رَضِيتُ بِاللَّهِ رَبًّا") || text.includes("رَضيـتُ بِاللهِ")) return 87;
  if (text.includes("يَا حَيُّ يَا قَيُّومُ") || text.includes("يَا حَيُّ يَا قيُّومُ")) return 88;
  if (text.includes("أَمْسَيْنَا عَلَى فِطْرَةِ") || text.includes("أَمْسَيْنَا عَلَى فِطْرَةِ")) return 89;
  if (text.includes("سُبْحَانَ اللَّهِ وَبِحَمْدِهِ") && text.includes("عَدَدَ خَلْقِهِ")) return 92;
  if (text.includes("سُبْحَانَ اللَّهِ وَبِحَمْدِهِ")) return 90;
  if (text.includes("لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ") || text.includes("لا إلهَ إلاّ اللّهُ وحْدَهُ")) return 91;
  if (text.includes("عِلْمًا نَافِعًا")) return 93;
  if (text.includes("أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ")) return 94;
  if (text.includes("أَعُوذُ بِكَلِمَاتِ اللَّهِ")) return 95;
  if (text.includes("اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا")) return 96;
  return null;
};

const getSleepAudioId = (text: string): number | null => {
  if (text.includes("بِاسْمِكَ رَبِّـي وَضَعْـتُ")) return 99;
  if (text.includes("خَلَـقْتَ نَفْسـي")) return 100;
  if (text.includes("قِنـي عَذابَـكَ")) return 101;
  if (text.includes("بِاسْـمِكَ اللّهُـمَّ أَمـوتُ")) return 102;
  if (text.includes("الـحَمْدُ للهِ الَّذي أَطْـعَمَنا")) return 104;
  if (text.includes("عالِـمَ الغَ-يبِ") || text.includes("عالِـمَ الغَـيبِ")) return 105;
  if (text.includes("أَسْـلَمْتُ نَفْـسي")) return 107;
  if (text.includes("سُبْحَانَ اللَّهِ")) return 106;
  if (text.includes("الْحَمْدُ لِلَّهِ")) return 106;
  if (text.includes("اللَّهُ أَكْبَرُ")) return 106;
  return null;
};

const getWakeAudioId = (text: string): number | null => {
  if (text.includes("الْحَمْدُ للهِ الَّذِي أَحْيَانَا")) return 1;
  if (text.includes("لا إلهَ إلاّ اللّهُ وَحْدَهُ")) return 2;
  if (text.includes("عافاني في جَسَدي")) return 3;
  return null;
};

export const AdhkarReader: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  const [adhkarList, setAdhkarList] = useState<Dhikr[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Unified Audio State
  const [selectedReciter, setSelectedReciter] = useState(() => audioService.getAdhkarReciter());
  const [globalAudio, setGlobalAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingGlobal, setIsPlayingGlobal] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showReciterMenu, setShowReciterMenu] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) return;
      setLoading(true);
      const list = await adhkarApi.getAdhkarByCategory(categoryId);
      setAdhkarList(list);
      
      const initialCounts = list.reduce((acc, dhikr) => ({
        ...acc,
        [dhikr.id]: dhikr.count
      }), {} as Record<string, number>);
      
      setCounts(initialCounts);
      setLoading(false);
    };
    loadData();
  }, [categoryId]);

  // Sync playback rate when changed
  useEffect(() => {
    if (globalAudio) {
      globalAudio.playbackRate = playbackRate;
    }
  }, [playbackRate, globalAudio]);

  // Handle global audio state changes
  useEffect(() => {
    if (!globalAudio) return;

    const updateTime = () => setCurrentTime(globalAudio.currentTime);
    const updateDuration = () => setDuration(globalAudio.duration);

    globalAudio.addEventListener('timeupdate', updateTime);
    globalAudio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      globalAudio.removeEventListener('timeupdate', updateTime);
      globalAudio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [globalAudio]);

  // Cleanup on unmount or category change
  useEffect(() => {
    return () => {
      if (globalAudio) {
        globalAudio.pause();
      }
    };
  }, [globalAudio, categoryId]);

  const getCategoryName = (id: string) => {
    switch(id) {
      case 'morning': return 'أذكار الصباح';
      case 'evening': return 'أذكار المساء';
      case 'sleep': return 'أذكار النوم';
      case 'wake': return 'أذكار الاستيقاظ';
      case 'after-prayer': return 'أذكار بعد الصلاة';
      case 'tasbih': return 'تسابيح';
      case 'quranic-duas': return 'أدعية قرآنية';
      case 'prophetic-duas': return 'أدعية الأنبياء';
      default: return 'الأذكار';
    }
  };

  const handleTap = (id: string) => {
    setCounts(prev => {
      const current = prev[id];
      if (current > 0) {
        if (navigator.vibrate) navigator.vibrate(50);
        return { ...prev, [id]: current - 1 };
      }
      return prev;
    });
  };

  const isCompleted = (id: string) => counts[id] === 0;
  const allCompleted = adhkarList.length > 0 && adhkarList.every(d => isCompleted(d.id));

  // Determine if we play a single continuous file (Alafasy morning/evening)
  const isAlafasyContinuous = selectedReciter === 'ar.alafasy' && (categoryId === 'morning' || categoryId === 'evening');

  // Sequential playlist player for individual cards
  const playPlaylistIndex = (index: number) => {
    if (index < 0 || index >= adhkarList.length) {
      // Finished all items!
      setIsPlayingGlobal(false);
      setPlayingCardId(null);
      return;
    }

    if (globalAudio) {
      globalAudio.pause();
    }

    const dhikr = adhkarList[index];
    let id: number | null = null;
    if (categoryId === 'morning') id = getMorningAudioId(dhikr.text);
    else if (categoryId === 'evening') id = getEveningAudioId(dhikr.text);
    else if (categoryId === 'sleep') id = getSleepAudioId(dhikr.text);
    else if (categoryId === 'wake') id = getWakeAudioId(dhikr.text);

    if (id) {
      const url = `https://hisnmuslim.com/audio/ar/${id}.mp3`;
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      
      setGlobalAudio(audio);
      setPlayingCardId(dhikr.id);
      setIsPlayingGlobal(true);

      // Smooth scroll active card into view
      const element = document.getElementById(`dhikr-card-${dhikr.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      audio.play().then(() => {
        audio.onended = () => {
          // Play the next card in the list
          playPlaylistIndex(index + 1);
        };
      }).catch(err => {
        console.error("Failed to play playlist card, skipping to next", err);
        playPlaylistIndex(index + 1);
      });
    } else {
      // Skip cards with no audio and play next
      playPlaylistIndex(index + 1);
    }
  };

  // Audio event handlers
  const toggleGlobalPlayback = () => {
    if (isPlayingGlobal) {
      if (globalAudio) {
        globalAudio.pause();
      }
      setIsPlayingGlobal(false);
    } else {
      if (isAlafasyContinuous) {
        if (globalAudio) {
          globalAudio.playbackRate = playbackRate;
          globalAudio.play().then(() => setIsPlayingGlobal(true)).catch(err => console.error("Play failed", err));
        } else {
          const url = audioService.getAdhkarCategoryAudioUrl(categoryId || '', selectedReciter);
          if (url) {
            const audio = new Audio(url);
            audio.playbackRate = playbackRate;
            
            // Set up ended listener for Alafasy continuous file
            audio.addEventListener('ended', () => {
              setIsPlayingGlobal(false);
              setCurrentTime(0);
            });

            audio.play().then(() => {
              setGlobalAudio(audio);
              setIsPlayingGlobal(true);
            }).catch(err => console.error("Play failed", err));
          }
        }
      } else {
        const currentIndex = adhkarList.findIndex(d => d.id === playingCardId);
        const startIndex = currentIndex !== -1 ? currentIndex : 0;
        playPlaylistIndex(startIndex);
      }
    }
  };

  const stopGlobalPlayback = () => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
    }
    setIsPlayingGlobal(false);
    setPlayingCardId(null);
  };

  const handleReciterChange = (reciterId: string) => {
    audioService.setAdhkarReciter(reciterId);
    setSelectedReciter(reciterId);
    
    if (globalAudio) {
      globalAudio.pause();
      setGlobalAudio(null);
      setIsPlayingGlobal(false);
      setPlayingCardId(null);
      setCurrentTime(0);
    }
  };

  const handleCardPlay = (dhikr: Dhikr, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid page count decrement
    
    if (playingCardId === dhikr.id && isPlayingGlobal) {
      if (globalAudio) {
        globalAudio.pause();
      }
      setIsPlayingGlobal(false);
    } else {
      // In Alafasy continuous mode, playing a card will play only that card
      if (isAlafasyContinuous) {
        if (globalAudio) {
          globalAudio.pause();
        }
        
        let id: number | null = null;
        if (categoryId === 'morning') id = getMorningAudioId(dhikr.text);
        else if (categoryId === 'evening') id = getEveningAudioId(dhikr.text);
        
        if (id) {
          const url = `https://hisnmuslim.com/audio/ar/${id}.mp3`;
          const audio = new Audio(url);
          audio.playbackRate = playbackRate;
          setGlobalAudio(audio);
          setPlayingCardId(dhikr.id);
          setIsPlayingGlobal(true);
          
          audio.play().catch(err => console.error("Play failed", err));
          audio.onended = () => {
            setPlayingCardId(null);
            setIsPlayingGlobal(false);
          };
        }
      } else {
        // Playlist mode: play starting from this card
        const index = adhkarList.findIndex(d => d.id === dhikr.id);
        if (index !== -1) {
          playPlaylistIndex(index);
        }
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!globalAudio || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = clickX / width;
    globalAudio.currentTime = clickPercent * duration;
    setCurrentTime(globalAudio.currentTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasCardAudio = (dhikr: Dhikr) => {
    if (categoryId === 'morning') return getMorningAudioId(dhikr.text) !== null;
    if (categoryId === 'evening') return getEveningAudioId(dhikr.text) !== null;
    if (categoryId === 'sleep') return getSleepAudioId(dhikr.text) !== null;
    if (categoryId === 'wake') return getWakeAudioId(dhikr.text) !== null;
    return false;
  };

  const hasAudioItems = adhkarList.some(d => hasCardAudio(d));
  const currentPlayingIndex = adhkarList.findIndex(d => d.id === playingCardId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-36">
      
      {/* Header */}
      <div className="sticky top-0 md:top-20 z-40 bg-background/95 dark:bg-background-dark/95 backdrop-blur-md py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/adhkar')}>
          <ChevronRight size={24} />
        </Button>
        <h2 className="font-bold text-xl text-primary dark:text-primary-light">
          {getCategoryName(categoryId || '')}
        </h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Completion Banner */}
      <AnimatePresence>
        {allCompleted && adhkarList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold">بارك الله فيك، لقد أتممت الأذكار!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adhkar List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12 text-primary">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            {adhkarList.map(dhikr => (
              <motion.div
                key={dhikr.id}
                id={`dhikr-card-${dhikr.id}`}
                layout
                initial={{ opacity: 1 }}
                animate={{ opacity: isCompleted(dhikr.id) ? 0.6 : 1 }}
              >
                <Card 
                  className={`p-6 md:p-8 text-center cursor-pointer select-none transition-all duration-300 ${
                    playingCardId === dhikr.id 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary-dark/10' 
                      : isCompleted(dhikr.id) 
                      ? 'bg-black/5 dark:bg-white/5 border-transparent shadow-none' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleTap(dhikr.id)}
                >
                  <p className="font-quran text-2xl md:text-3xl leading-loose mb-6 whitespace-pre-line">
                    {dhikr.text}
                  </p>

                  {dhikr.description && (
                    <p className="text-sm text-amber-700 dark:text-amber-500 bg-amber-500/5 p-3 rounded-xl mb-4 font-sans leading-relaxed">
                      {dhikr.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 mt-4">
                    <div className="flex items-center gap-3">
                      {hasCardAudio(dhikr) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-10 h-10 rounded-full hover:bg-primary/5 transition-colors ${
                            playingCardId === dhikr.id 
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                              : 'text-primary hover:text-primary-dark dark:text-primary-light'
                          }`}
                          onClick={(e) => handleCardPlay(dhikr, e)}
                        >
                          {playingCardId === dhikr.id && isPlayingGlobal ? <Pause size={18} /> : <Play size={18} />}
                        </Button>
                      )}
                      <span className="text-sm text-text-muted">{dhikr.reference}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-text-muted">
                        المطلوب: {dhikr.count}
                      </div>
                      
                      <motion.div 
                        key={counts[dhikr.id]}
                        initial={{ scale: 1.2, color: '#176B5B' }}
                        animate={{ scale: 1, color: isCompleted(dhikr.id) ? '#10B981' : '' }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                          ${isCompleted(dhikr.id) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-primary text-white'}
                        `}
                      >
                        {isCompleted(dhikr.id) ? <CheckCircle2 size={20} /> : counts[dhikr.id]}
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            
            {adhkarList.length === 0 && (
              <div className="text-center p-12 text-text-muted">
                سيتم إضافة أذكار هذا القسم قريباً.
              </div>
            )}
          </>
        )}
      </div>

      {/* Reciter Menu Popover */}
      {showReciterMenu && (
        <>
          <div 
            className="fixed inset-0 z-45 bg-transparent" 
            onClick={() => setShowReciterMenu(false)}
          />
          <div className="fixed bottom-48 md:bottom-36 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[320px]">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-white dark:bg-card-dark shadow-2xl rounded-2xl p-3 border border-black/5 dark:border-white/10 flex flex-col gap-1 w-full text-right"
              dir="rtl"
            >
              <div className="text-xs font-bold text-text-muted px-3 py-2 border-b border-black/5 dark:border-white/5 text-right font-sans">
                اختر القارئ للأذكار:
              </div>
              {ADHAKAR_RECITERS.map(reciter => (
                <button
                  key={reciter.id}
                  onClick={() => {
                    handleReciterChange(reciter.id);
                    setShowReciterMenu(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-right text-sm font-semibold transition-colors font-sans ${
                    selectedReciter === reciter.id
                      ? 'bg-primary text-white'
                      : 'text-text-main dark:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-right flex-1">{reciter.name}</span>
                  {selectedReciter === reciter.id && <CheckCircle2 size={16} className="text-white dark:text-primary-light" />}
                </button>
              ))}
            </motion.div>
          </div>
        </>
      )}

      {/* Global Bottom Audio Player */}
      {hasAudioItems && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-card dark:bg-card-dark shadow-2xl rounded-2xl p-4 flex flex-col gap-3 border border-black/5 dark:border-white/10 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Top Row: Track Name & Reciter Info */}
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-2">
              <Music className="text-primary animate-pulse" size={18} />
              <span className="text-sm font-bold text-text-main dark:text-text-darkMain font-sans">
                {currentPlayingIndex !== -1 
                  ? `استماع متواصل: الذكر ${currentPlayingIndex + 1} من ${adhkarList.length}`
                  : `استماع متواصل: ${getCategoryName(categoryId || '')}`
                }
              </span>
            </div>
            
            <button
              onClick={() => setShowReciterMenu(!showReciterMenu)}
              className="text-xs font-semibold text-primary dark:text-primary-light hover:underline font-sans flex items-center gap-1"
            >
              <span>بصوت: {ADHAKAR_RECITERS.find(r => r.id === selectedReciter)?.name.split(' (')[0] || 'القارئ'}</span>
              <Settings size={14} />
            </button>
          </div>

          {/* Middle Row: Progress Bar */}
          <div className="flex items-center gap-3 w-full" dir="ltr">
            <span className="text-xs text-text-muted font-sans font-semibold min-w-[32px]">
              {formatTime(currentTime)}
            </span>
            
            <div 
              className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            <span className="text-xs text-text-muted font-sans font-semibold min-w-[32px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Speed Control */}
            <button
              onClick={() => {
                const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
                setPlaybackRate(nextRate);
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-black/10 dark:border-white/10 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 font-sans"
            >
              {playbackRate}x
            </button>

            {/* Play/Pause Button */}
            <Button 
              variant="primary" 
              size="icon" 
              className="rounded-full w-12 h-12 shadow-md hover:scale-105 transition-transform"
              onClick={toggleGlobalPlayback}
            >
              {isPlayingGlobal ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </Button>

            {/* Stop Button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10 border border-black/10 dark:border-white/10"
              onClick={stopGlobalPlayback}
              disabled={!globalAudio && currentPlayingIndex === -1}
            >
              <Square size={16} fill="currentColor" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

