import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    defaultOpen = true,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-lg font-semibold text-white/90 hover:text-blue-400 transition-colors w-full text-left group"
            >
                <div className="p-1 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {title}
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

export default CollapsibleSection;
