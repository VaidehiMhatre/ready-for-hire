import React, { useState } from 'react';
import { Home } from './components/pages/Home';
import { PersonalityQuiz } from './components/pages/PersonalityQuiz';
import { ResumeAssessment } from './components/pages/ResumeAssessment';
import { HRQuestions } from './components/pages/HRQuestions';
import { VoiceAssessment } from './components/pages/VoiceAssessment';
import { EssayWriting } from './components/pages/EssayWriting';
import { Dashboard } from './components/pages/Dashboard';
import { Navbar } from './components/ui';
import { FullScreenEnforcer } from './components/FullScreenEnforcer';
import type { Page } from './types';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');

    const handleForceExit = () => {
        alert("You have exited full-screen mode. For test integrity, your assessment session has been terminated. You will need to restart the entire process.");
        // Clear all assessment progress from localStorage
        localStorage.removeItem('resumeAnalysis');
        localStorage.removeItem('hrAnalysis');
        localStorage.removeItem('voiceAnalysis');
        localStorage.removeItem('essayAnalysis');
        localStorage.removeItem('assessmentConfig');
        localStorage.removeItem('personalizedQuestions');
        // Navigate back to the home page
        setPage('home');
    };

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <Home setPage={setPage} />;
            case 'quiz':
                return <PersonalityQuiz setPage={setPage} />;
            case 'prep-start': // This will redirect to the first step
            case 'prep-resume':
                return <ResumeAssessment setPage={setPage} />;
            case 'prep-hr':
                return <HRQuestions setPage={setPage} />;
            case 'prep-voice':
                return <VoiceAssessment setPage={setPage} />;
            case 'prep-essay':
                return <EssayWriting setPage={setPage} />;
            case 'prep-dashboard':
                return <Dashboard setPage={setPage} />;
            default:
                return <Home setPage={setPage} />;
        }
    };
    
    // Resume Assessment handles its own fullscreen logic now
    const isAssessmentPage = ['quiz', 'prep-hr', 'prep-voice', 'prep-essay'].includes(page);
    const pageContent = renderPage();

    return (
        <main className="min-h-screen text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-6xl">
                <header className="text-center mb-6">
                    <h1 className="text-4xl sm:text-5xl font-bold text-primary-400 tracking-tight cursor-pointer" onClick={() => setPage('home')}>
                        Ready for Hire
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Your AI-Powered Career Preparation Platform</p>
                </header>
                
                <Navbar page={page} setPage={setPage} />

                <div className="bg-surface/30 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-700/50 mt-6">
                    {isAssessmentPage ? (
                        <FullScreenEnforcer onForceExit={handleForceExit}>{pageContent}</FullScreenEnforcer>
                    ) : (
                        pageContent
                    )}
                </div>
                 <footer className="text-center mt-8 text-gray-500 text-sm">
                    <p>Version 3.0 | &copy; 2025 AI Career Prep Inc. All rights reserved.</p>
                </footer>
            </div>
        </main>
    );
};

export default App;