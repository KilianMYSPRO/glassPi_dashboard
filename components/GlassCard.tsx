import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon, action }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 hover:bg-slate-800/50 flex flex-col ${className}`}>
      {(title || icon) && (
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            {icon && <span className="text-blue-400">{icon}</span>}
            {title && <h3 className="text-lg font-semibold text-white/90 tracking-wide">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;