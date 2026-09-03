import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { audioService, RECITERS } from '../services/audioService';
import type { Ayah } from '../services/quranApi';
import { Play, Pause, X, Repeat, Music, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalPlayerContextType {
  isPlaying: boolean;
  currentTitle: string;
  subtitle: string;
  surahNumber: number | null;
  activeAyahNumber: number | null;
  isFullSurahMode: boolean;
  isRepeating: boolean;
  playFullSurah: (surahNumber: number, surahName: string, reciterId?: string) => void;
  playAyah: (surahNumber: number, surahName: string, ayah: Ayah, surahAyahs: Ayah[], reciterId?: string) => void;
  playAudioUrl: (url: string, title: string, subtitle: string) => void;
  togglePlayPause: () => void;
  stopAudio: () => void;
  toggleRepeat: () => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | undefined>(undefined);

export const GlobalPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [surahNumber, setSurahNumber] = useState<number | null>(null);
  const [activeAyahNumber, setActiveAyahNumber] = useState<number | null>(null);
  const [isFullSurahMode, setIsFullSurahMode] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRepeatingRef = useRef(isRepeating);
  const currentSurahAyahsRef = useRef<Ayah[]>([]);
  const currentSurahNameRef = useRef<string>('');
  const currentSurahNumberRef = useRef<number | null>(null);

  useEffect(() => {
    isRepeatingRef.current = isRepeating;
  }, [isRepeating]);

  // Clean up audio on provider unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Get or create persistent HTMLAudioElement (reused to bypass mobile autoplay policies)
  const getAudioElement = (): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const safePlayAudio = async (audio: HTMLAudioElement) => {
    try {
      audio.load();
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio play was blocked; retrying after load:', err);
      setTimeout(() => {
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }, 250);
    }
  };

  // Sync Mobile MediaSession for Lock Screen / Background Playback
  const updateMediaSession = (title: string, artist: string) => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album: 'القرآن الكريم والأذكار',
          artwork: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        });
      } catch (e) {
        console.warn('MediaSession initialization error:', e);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
    setIsPlaying(false);
    setCurrentTitle('');
    setSubtitle('');
    setSurahNumber(null);
    setActiveAyahNumber(null);
    setIsFullSurahMode(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error('Audio play error:', err));
    }
  };

  const toggleRepeat = () => {
    setIsRepeating(prev => !prev);
  };

  // Play Full Surah (Continuous audio file)
  const playFullSurah = (sNum: number, sName: string, reciterId?: string) => {
    const audio = getAudioElement();
    audio.pause();

    const reciterKey = reciterId || audioService.getReciter();
    const reciterName = RECITERS.find(r => r.id === reciterKey)?.name || 'الشيخ القارئ';
    const url = audioService.getSurahAudioUrl(sNum, reciterKey);

    audio.src = url;
    audio.load();
    
    setSurahNumber(sNum);
    setActiveAyahNumber(null);
    setIsFullSurahMode(true);
    const titleStr = `سورة ${sName}`;
    const subStr = `تلاوة كاملة • ${reciterName}`;
    setCurrentTitle(titleStr);
    setSubtitle(subStr);

    updateMediaSession(titleStr, reciterName);

    safePlayAudio(audio).catch(err => console.error('Full Surah Play Error:', err));

    audio.onended = () => {
      if (isRepeatingRef.current) {
        playFullSurah(sNum, sName, reciterId);
      } else {
        setIsPlaying(false);
      }
    };
  };

  // Play specific Ayah (Verse-by-Verse audio)
  const playAyah = (sNum: number, sName: string, ayah: Ayah, surahAyahs: Ayah[], reciterId?: string) => {
    const audio = getAudioElement();
    audio.pause();

    currentSurahAyahsRef.current = surahAyahs;
    currentSurahNameRef.current = sName;
    currentSurahNumberRef.current = sNum;

    const reciterKey = reciterId || audioService.getReciter();
    const reciterName = RECITERS.find(r => r.id === reciterKey)?.name || 'الشيخ القارئ';
    const url = audioService.getAyahAudioUrl(ayah.number, reciterKey);

    audio.src = url;
    audio.load();

    setSurahNumber(sNum);
    setActiveAyahNumber(ayah.numberInSurah);
    setIsFullSurahMode(false);
    const titleStr = `سورة ${sName}`;
    const subStr = `الآية ${ayah.numberInSurah} • ${reciterName}`;
    setCurrentTitle(titleStr);
    setSubtitle(subStr);

    updateMediaSession(`${titleStr} - آية ${ayah.numberInSurah}`, reciterName);

    safePlayAudio(audio).catch(err => console.error('Ayah Play Error:', err));

    audio.onended = () => {
      if (isRepeatingRef.current) {
        playAyah(sNum, sName, ayah, surahAyahs, reciterId);
      } else {
        const nextAyah = surahAyahs.find(a => a.numberInSurah === ayah.numberInSurah + 1);
        if (nextAyah) {
          playAyah(sNum, sName, nextAyah, surahAyahs, reciterId);
        } else {
          setIsPlaying(false);
        }
      }
    };
  };

  // Generic custom URL audio player (e.g. Adhkar)
  const playAudioUrl = (url: string, title: string, sub: string) => {
    const audio = getAudioElement();
    audio.pause();

    audio.src = url;
    audio.load();

    setSurahNumber(null);
    setActiveAyahNumber(null);
    setIsFullSurahMode(false);
    setCurrentTitle(title);
    setSubtitle(sub);

    updateMediaSession(title, sub);

    safePlayAudio(audio).catch(err => console.error('Audio URL Play Error:', err));

    audio.onended = () => {
      if (isRepeatingRef.current) {
        playAudioUrl(url, title, sub);
      } else {
        setIsPlaying(false);
      }
    };
  };

  return (
    <GlobalPlayerContext.Provider
      value={{
        isPlaying,
        currentTitle,
        subtitle,
        surahNumber,
        activeAyahNumber,
        isFullSurahMode,
        isRepeating,
        playFullSurah,
        playAyah,
        playAudioUrl,
        togglePlayPause,
        stopAudio,
        toggleRepeat,
      }}
    >
      {children}
      <GlobalMiniPlayer />
    </GlobalPlayerContext.Provider>
  );
};

export const useGlobalPlayer = () => {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error('useGlobalPlayer must be used within GlobalPlayerProvider');
  }
  return context;
};

// Persistent Mini Player rendered on all pages when audio is loaded/playing!
const GlobalMiniPlayer: React.FC = () => {
  const { currentTitle, subtitle, isPlaying, togglePlayPause, stopAudio, surahNumber, isRepeating, toggleRepeat } = useGlobalPlayer();
  const navigate = useNavigate();

  if (!currentTitle) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-gray-900/95 dark:bg-black/95 text-white shadow-2xl rounded-2xl p-3 px-4 flex items-center justify-between border border-white/10 backdrop-blur-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Title & Info (Clicking navigates to surah reader) */}
      <div 
        className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
        onClick={() => surahNumber && navigate(`/quran/read/${surahNumber}`)}
      >
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg relative">
          <Music size={20} className={isPlaying ? 'animate-pulse' : ''} />
        </div>
        <div className="truncate text-right" dir="rtl">
          <h4 className="font-bold text-sm text-white truncate flex items-center gap-1">
            <span>{currentTitle}</span>
            {surahNumber && <ChevronLeft size={14} className="text-white/60" />}
          </h4>
          <p className="text-[11px] text-white/70 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Repeat Toggle */}
        <button 
          onClick={toggleRepeat}
          className={`p-2 rounded-full transition-colors ${isRepeating ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white/60 hover:text-white'}`}
          title={isRepeating ? 'إيقاف التكرار' : 'تفعيل التكرار'}
        >
          <Repeat size={18} />
        </button>

        {/* Play/Pause */}
        <button 
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* Close */}
        <button 
          onClick={stopAudio}
          className="p-2 text-white/60 hover:text-white rounded-full transition-colors"
          title="إغلاق القارئ"
        >
          <X size={18} />
        </button>
      </div>

    </div>
  );
};
