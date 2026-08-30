import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useDarkMode } from '../../hooks/useDarkMode';
import { InstallPWA } from '../ui/InstallPWA';

export const Layout: React.FC = () => {
  // Initialize dark mode on app load
  useDarkMode();

  return (
    <div className="min-h-screen pb-16 md:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Outlet />
      </main>
      <MobileNav />
      <InstallPWA />
    </div>
  );
};
