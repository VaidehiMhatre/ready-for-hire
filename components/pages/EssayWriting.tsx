

import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../../types';
import { analyzeEssay } from '../../services/geminiService';
import { Button, Loader, Card, ArrowRightIcon } from '../ui';

interface EssayWritingProps {
    setPage: (page: Page) => void;
}

interface Prompt {
    id: number;
    text: string;
}

interface AnalysisResult {
    analyses: {
        prompt: string;
        feedback: string;
        score: number;
    }[];
}

const MIN_WORDS = 20;
const MAX_WORDS = 250;

export const EssayWriting: React.FC<EssayWritingProps> = ({ setPage }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [promptsLoading, setPromptsLoading] = useState(true);
    const [essays, setEssays] = useState<{ [key: number]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        const loadPrompts = () => {
            setError(null);
            try {
                const allQuestionsStr = localStorage.getItem('personalizedQuestions');
                if (!allQuestionsStr) {
                    throw new Error("Personalized questions not found. Please start from the resume step.");
                }
                const { essay_prompts } = JSON.parse(allQuestionsStr);
                if (!essay_prompts) {
                    throw new Error("Essay prompts are missing from the assessment data.");
                }
                setPrompts(essay_prompts.map((text: string, index: number) => ({ id: index, text })));
            } catch (err: any) {
                console.error("Failed to load essay prompts:", err);
                setError(err.message || "Could not load personalized essay prompts.");
            } finally {
                setPromptsLoading(false);
            }
        };

        loadPrompts();
    }, []);

    const checkAllEssaysValid = useCallback(() => {
        if (prompts.length === 0) return false;
        return prompts.every(p => {
            const text = essays[p.id];
            if (typeof text !== 'string') return false;
            const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
            return wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
        });
    }, [essays, prompts]);


    const handleAnalysis = useCallback(async () => {
        if (!checkAllEssaysValid()) {
            setError(`Please ensure each essay is between ${MIN_WORDS} and ${MAX_WORDS} words.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const analysisPayload = prompts.map(p => ({
                prompt: p.text,
                text: essays[p.id] || ''
            }));
            const analysisResult = await analyzeEssay(analysisPayload);
            setResult(analysisResult);
            
            // Calculate average score for dashboard
            const avgScore = analysisResult.analyses.reduce((acc, curr) => acc + curr.score, 0) / analysisResult.analyses.length;
            const unifiedFeedback = analysisResult.analyses.map(a => a.feedback).join(' ');
            localStorage.setItem('essayAnalysis', JSON.stringify({ ...analysisResult, score: avgScore, feedback: unifiedFeedback }));
        } catch (err) {
            console.error("Essay analysis failed:", err);
            setError("Sorry, the AI analysis failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [essays, prompts, checkAllEssaysValid]);
    
    useEffect(() => {
        if (promptsLoading || result || isLoading) return;

        if (timeLeft <= 0) {
            handleAnalysis();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, promptsLoading, result, isLoading, handleAnalysis]);


    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleTextChange = (promptId: number, text: string) => {
        setEssays(prev => ({...prev, [promptId]: text}));
    };
    
    if (promptsLoading) return <Loader message="Loading personalized essay topics..." />;

    if (isLoading) {
        return <Loader message="Analyzing your writing style, clarity, and structure..." />;
    }

    if (result) {
        const avgScore = result.analyses.reduce((acc, curr) => acc + curr.score, 0) / result.analyses.length;
        return (
             <div className="animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-primary-400 mb-2">Essay Assessment Complete</h2>
                <p className="text-gray-300 mb-6">Here's a breakdown of your performance for each essay.</p>

                <div className="space-y-6 text-left">
                    {result.analyses.map((analysis, index) => (
                        <Card key={index} borderColor={index === 0 ? 'primary' : 'accent'}>
                             <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-white mb-2 max-w-[80%]">Question {index + 1}: "{analysis.prompt}"</h3>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Score</p>
                                    <p className="text-2xl font-bold text-primary-300">{analysis.score}<span className="text-lg text-gray-500">/10</span></p>
                                </div>
                            </div>
                            <div className="mt-2 pt-3 border-t border-slate-700">
                                <h4 className="font-semibold text-gray-200">AI Feedback:</h4>
                                <p className="text-gray-300">{analysis.feedback}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-8">
                     <p className="text-xl">Your Average Score: <span className="font-bold text-primary-300">{avgScore.toFixed(1)}/10</span></p>
                </div>

                <Button onClick={() => setPage('prep-dashboard')} className="mt-6">
                    See Final Dashboard <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in relative">
            <div className="absolute top-0 right-0 bg-surface text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm border border-slate-700">
                Time Left: {formatTime(timeLeft)}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Step 4: Essay Writing</h2>
            <p className="text-center text-gray-400 mb-6">{`Write a short essay (${MIN_WORDS}-${MAX_WORDS} words) for each personalized topic.`}</p>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            
            {prompts.length > 0 ? (
                <>
                    <div className="space-y-6">
                        {prompts.map(p => {
                            const text = essays[p.id] || '';
                            const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                            const isValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
                            return (
                                <Card key={p.id}>
                                    <label className="block text-lg font-medium text-gray-100 mb-4">{p.text}</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => handleTextChange(p.id, e.target.value)}
                                        placeholder="Start writing your essay here..."
                                        className="w-full h-52 p-3 bg-surface border border-slate-600/80 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-200"
                                    />
                                    <div className={`text-right text-sm mt-2 ${!isValid && text.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        Word count: {wordCount} / {MAX_WORDS}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleAnalysis} disabled={!checkAllEssaysValid()}>
                            Finish & Analyze Essays
                        </Button>
                    </div>
                </>
             ) : !error && (
                <Loader message="Loading prompts..." />
            )}
        </div>
    );
};
