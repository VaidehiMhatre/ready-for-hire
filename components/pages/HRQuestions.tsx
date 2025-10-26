

import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../../types';
import { analyzeHRAnswers } from '../../services/geminiService';
import { Button, Loader, Card, ArrowRightIcon } from '../ui';

interface HRQuestionsProps {
    setPage: (page: Page) => void;
}

interface HRQuestion {
    question: string;
    options: string[];
}

export const HRQuestions: React.FC<HRQuestionsProps> = ({ setPage }) => {
    const [questions, setQuestions] = useState<HRQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ feedback: string[], score: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useEffect(() => {
        const loadQuestions = () => {
            setError(null);
            try {
                const allQuestionsStr = localStorage.getItem('personalizedQuestions');
                if (!allQuestionsStr) {
                    throw new Error("Personalized questions not found. Please start from the resume step.");
                }
                const { hr_questions } = JSON.parse(allQuestionsStr);
                if (!hr_questions) {
                    throw new Error("HR questions are missing from the assessment data.");
                }
                setQuestions(hr_questions);
            } catch (err: any) {
                console.error("Failed to load HR questions:", err);
                setError(err.message || "Could not load personalized HR questions.");
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
    }, []);

    const handleAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const configStr = localStorage.getItem('assessmentConfig');
             if (!configStr) {
                throw new Error("Assessment configuration not found.");
            }
            const { role } = JSON.parse(configStr);

            const userAnswersArray = questions.map((_, i) => answers[i] ?? -1);
            const analysisResult = await analyzeHRAnswers(questions, userAnswersArray, role);
            setResult(analysisResult);
            localStorage.setItem('hrAnalysis', JSON.stringify(analysisResult));
        } catch (err: any) {
            console.error("HR analysis failed:", err);
            setError(err.message || "Sorry, the AI analysis failed. Please try again.");
            localStorage.setItem('hrAnalysis', JSON.stringify({ error: "AI analysis failed" }));
        } finally {
            setIsAnalyzing(false);
        }
    }, [answers, questions]);

    useEffect(() => {
        if (result || isLoading || isAnalyzing) return;

        if (timeLeft <= 0) {
            handleAnalysis();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, result, isLoading, isAnalyzing, handleAnalysis]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleAnswerSelect = (qIndex: number, aIndex: number) => {
        setAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
    };
    
    if (isLoading) {
        return <Loader message="Loading personalized HR questions..." />;
    }

    if (isAnalyzing) {
        return <Loader message="Analyzing your behavioral answers..." />;
    }

    if (result) {
        return (
            <div className="animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-primary-400 mb-4">HR Assessment Complete</h2>
                <Card borderColor="primary">
                    <h3 className="text-xl font-semibold mb-3">AI Feedback</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 text-left mb-4">
                        {result.feedback.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                    <p className="text-xl">Your Score: <span className="font-bold text-primary-300">{result.score}/10</span></p>
                </Card>
                <Button onClick={() => setPage('prep-voice')} className="mt-8">
                    Next: Voice Assessment <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in relative">
            <div className="absolute top-0 right-0 bg-surface text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm border border-slate-700">
                Time Left: {formatTime(timeLeft)}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Step 2: HR Questions</h2>
            <p className="text-center text-gray-400 mb-6">Answer the following situational judgment questions tailored to your profile.</p>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            {questions.length > 0 ? (
                <>
                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <Card key={qIndex}>
                                <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, aIndex) => (
                                        <label key={aIndex} className={`block p-3 rounded-lg border transition-colors cursor-pointer ${answers[qIndex] === aIndex ? 'bg-primary-900/80 border-primary-500' : 'bg-surface border-slate-700 hover:bg-surface-accent'}`}>
                                            <input
                                                type="radio"
                                                name={`q-${qIndex}`}
                                                checked={answers[qIndex] === aIndex}
                                                onChange={() => handleAnswerSelect(qIndex, aIndex)}
                                                className="hidden"
                                            />
                                            <span className="text-gray-300">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-8 text-center">
                        <Button onClick={handleAnalysis} disabled={Object.keys(answers).length !== questions.length}>
                            Submit & Analyze
                        </Button>
                    </div>
                </>
            ) : !error && (
                 <Loader message="Loading questions..."/>
            )}
        </div>
    );
};
