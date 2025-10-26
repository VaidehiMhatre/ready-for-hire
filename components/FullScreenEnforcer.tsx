import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui';

interface FullScreenEnforcerProps {
    children: React.ReactNode;
    onForceExit: () => void;
}

export const FullScreenEnforcer: React.FC<FullScreenEnforcerProps> = ({ children, onForceExit }) => {
    const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
    const [hasAgreed, setHasAgreed] = useState(false);

    const handleFullScreenChange = useCallback(() => {
        const isCurrentlyFullScreen = !!document.fullscreenElement;
        
        // This check is crucial: was it previously in fullscreen (tracked by component state)? 
        // We only want to trigger on the *exit* event.
        if (isFullScreen && !isCurrentlyFullScreen) {
            onForceExit();
        }

        setIsFullScreen(isCurrentlyFullScreen);
    }, [isFullScreen, onForceExit]);

    useEffect(() => {
        // Set initial state
        setIsFullScreen(!!document.fullscreenElement);
        
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [handleFullScreenChange]);

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    };

    return (
        <div className="w-full">
            {!isFullScreen ? (
                <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 mb-4">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    <h2 className="text-3xl font-bold text-primary-400 mb-3">Focus Mode Required</h2>
                    <p className="text-gray-300 mb-6 max-w-lg">
                        To ensure the integrity of the assessment and provide a distraction-free environment, this section must be completed in full-screen.
                        <br/><strong className="text-yellow-400 mt-2 block">Exiting full-screen will terminate your assessment.</strong>
                    </p>
                    
                    <div className="flex items-center justify-center mb-6">
                        <input
                            id="fullscreen-agree"
                            type="checkbox"
                            checked={hasAgreed}
                            onChange={() => setHasAgreed(!hasAgreed)}
                            className="h-4 w-4 text-primary-600 bg-surface border-slate-600/80 rounded focus:ring-primary-600"
                        />
                        <label htmlFor="fullscreen-agree" className="ml-2 text-sm text-gray-300">
                            I understand and agree to enter full-screen mode.
                        </label>
                    </div>

                    <Button onClick={enterFullScreen} size="lg" disabled={!hasAgreed}>
                        Enter Full-Screen Mode
                    </Button>
                </div>
            ) : (
                children
            )}
        </div>
    );
};