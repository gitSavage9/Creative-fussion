import React from 'react';
import { CubeIcon, EditIcon, MovieIcon, ChatIcon } from './Icon';
import { AppMode } from '../types';

interface HeaderProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-700/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ activeMode, onModeChange }) => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <CubeIcon className="w-8 h-8 mr-3 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-gray-100 hidden sm:block">
            Creative <span className="text-indigo-400">Fusion</span>
          </h1>
        </div>
        <nav className="flex items-center gap-2 p-1 bg-gray-800/60 rounded-lg">
          <NavButton
            icon={<CubeIcon className="w-5 h-5" />}
            label="3D Logo"
            isActive={activeMode === AppMode.LOGO}
            onClick={() => onModeChange(AppMode.LOGO)}
          />
          <NavButton
            icon={<EditIcon className="w-5 h-5" />}
            label="Edit"
            isActive={activeMode === AppMode.EDIT}
            onClick={() => onModeChange(AppMode.EDIT)}
          />
          <NavButton
            icon={<MovieIcon className="w-5 h-5" />}
            label="Animate"
            isActive={activeMode === AppMode.ANIMATE}
            onClick={() => onModeChange(AppMode.ANIMATE)}
          />
           <NavButton
            icon={<ChatIcon className="w-5 h-5" />}
            label="Chat"
            isActive={activeMode === AppMode.CHAT}
            onClick={() => onModeChange(AppMode.CHAT)}
          />
        </nav>
      </div>
    </header>
  );
};
