import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Book, Heart, Compass, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileNav: React.FC = () => {
  const links = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/quran', icon: Book, label: 'القرآن' },
    { to: '/adhkar', icon: Heart, label: 'الأذكار' },
    { to: '/prayer', icon: Compass, label: 'الصلاة' },
    { to: '/settings', icon: LayoutGrid, label: 'الإعدادات' }, 
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-black/5 dark:border-white/5 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive 
                  ? "text-primary dark:text-primary-light" 
                  : "text-text-muted dark:text-text-darkMuted hover:text-text-main dark:hover:text-text-darkMain"
              )
            }
          >
            <Icon size={24} />
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
