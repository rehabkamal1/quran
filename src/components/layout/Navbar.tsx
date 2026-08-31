import React from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Sun, Settings } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  const links = [
    { to: '/', label: 'الرئيسية' },
    { to: '/quran', label: 'القرآن' },
    { to: '/adhkar', label: 'الأذكار' },
    { to: '/duas', label: 'الأدعية' },
    { to: '/tasbih', label: 'التسبيح' },
    { to: '/prayer', label: 'الصلاة' },
    { to: '/khatmah', label: 'الختمة' },
    { to: '/about', label: 'عن المنصة والدعم' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-background/80 dark:bg-background-dark/80 backdrop-blur-md hidden md:block">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Huda Logo" className="w-10 h-10 object-contain drop-shadow-md rounded-lg" />
          <h1 className="text-2xl font-bold font-quran text-primary dark:text-primary-light">
            هداية
          </h1>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                    : 'text-text-muted hover:text-text-main dark:text-text-darkMuted dark:hover:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <NavLink to="/settings">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
          </NavLink>
        </div>
      </div>
    </header>
  );
};
