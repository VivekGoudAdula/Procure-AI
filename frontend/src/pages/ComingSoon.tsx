import React from 'react';
import { Cpu } from 'lucide-react';

const ComingSoon = ({ title }: { title: string }) => {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        <Cpu className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 max-w-md">
        This feature is currently under development. Our autonomous agents are working hard to bring this to you soon.
      </p>
    </div>
  );
};

export default ComingSoon;
