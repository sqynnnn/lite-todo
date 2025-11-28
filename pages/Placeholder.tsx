import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export const Placeholder: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-fade-in">
      <div className="p-6 bg-card rounded-full border border-gray-800">
        <Construction size={48} className="text-gold" />
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-500 max-w-sm">
        This module is currently under development. You can customize this space in the source code.
      </p>
    </div>
  );
};