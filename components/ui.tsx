import React from 'react';
import type { Page } from '../types';

// --- ICONS ---
export const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

export const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
    </svg>
);

export const StopCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><rect width="6" height="6" x="9" y="9"/>
    </svg>
);

export const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);

export const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
);


// --- COMPONENTS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    isLoading?: boolean;
    size?: 'default' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, disabled, className, size = 'default', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";
    const variantClasses = variant === 'primary'
        ? "bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20"
        : "bg-surface text-gray-200 hover:bg-surface-accent border border-slate-600/80";
    const sizeClasses = size === 'lg' ? 'px-8 py-3 text-base' : 'px-4 py-2 text-sm';

    return (
        <button
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <LoaderIcon className="mr-2 h-4 w-4" />}
            {children}
        </button>
    );
};

interface CardProps {
    children: React.ReactNode;
    className?: string;
    borderColor?: 'primary' | 'secondary' | 'accent' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className, borderColor = 'none' }) => {
    const borderClasses = {
        primary: 'border-t-2 border-primary-500',
        secondary: 'border-t-2 border-secondary-500',
        accent: 'border-t-2 border-accent-500',
        none: ''
    };
    return (
        <div className={`bg-surface/70 border border-slate-700/50 rounded-lg p-6 shadow-xl ${borderClasses[borderColor]} ${className}`}>
            {children}
        </div>
    );
};

export const Loader: React.FC<{ message?: string }> = ({ message = "AI is thinking..." }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <LoaderIcon className="w-10 h-10 text-primary-500" />
        <p className="mt-4 text-lg text-gray-300">{message}</p>
    </div>
);

interface NavbarProps {
    page: Page;
    setPage: (page: Page) => void;
}

const navLinks: { id: Page; label: string }[] = [
    { id: 'quiz', label: 'Personality Quiz' },
    { id: 'prep-resume', label: 'Resume' },
    { id: 'prep-hr', label: 'HR' },
    { id: 'prep-voice', label: 'Voice' },
    { id: 'prep-essay', label: 'Essay' },
    { id: 'prep-dashboard', label: 'Dashboard' },
];

export const Navbar: React.FC<NavbarProps> = ({ page, setPage }) => {
    return (
        <nav className="bg-surface/50 border border-slate-700/50 rounded-lg p-2 backdrop-blur-sm sticky top-4 z-10">
            <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                {navLinks.map(link => {
                    const isActive = page === link.id || (page.startsWith('prep-') && page.endsWith(link.id.split('-')[1]));
                    return (
                        <li key={link.id}>
                            <button 
                                onClick={() => setPage(link.id)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    isActive 
                                    ? 'bg-primary-600 text-white' 
                                    : 'text-gray-300 hover:bg-surface-accent hover:text-white'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {link.label}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    );
};