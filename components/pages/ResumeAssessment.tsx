import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../../types';
import { generateAllPersonalizedQuestions } from '../../services/geminiService';
import { extractTextFromPdf } from '../../utils/pdfParser';
import { Button, Loader, Card, ArrowRightIcon, UploadCloudIcon } from '../ui';

interface ResumeAssessmentProps {
    setPage: (page: Page) => void;
}

const domainToRoles: Record<string, string[]> = {
    "Web Development": ["Frontend Developer", "Backend Developer", "Full-Stack Developer"],
    "Mobile Development": ["iOS Developer", "Android Developer", "Cross-Platform Developer (React Native/Flutter)"],
    "Cloud Computing & DevOps": ["Cloud Engineer (AWS/GCP/Azure)", "DevOps Engineer", "Site Reliability Engineer (SRE)"],
    "Data Science & Analytics": ["Data Scientist", "Data Analyst", "Business Intelligence (BI) Analyst"],
    "Machine Learning & AI": ["Machine Learning Engineer", "AI Researcher", "NLP Engineer"],
    "Cybersecurity": ["Security Analyst", "Ethical Hacker / Penetration Tester", "Security Engineer"],
    "Game Development": ["Unity Developer", "Unreal Engine Developer", "Gameplay Programmer"],
    "Embedded Systems": ["Firmware Engineer", "Embedded Software Engineer"],
    "Quality Assurance": ["QA Automation Engineer", "Manual Tester", "Software Development Engineer in Test (SDET)"],
    "UI/UX Design": ["UI Designer", "UX Designer", "Product Designer"],
    "Product Management": ["Product Manager", "Technical Product Manager"],
    "Database Administration": ["Database Administrator (DBA)", "Data Engineer"],
};

const domains = Object.keys(domainToRoles);
const levels = ["Beginner", "Intermediate", "Expert"];

type AssessmentState = 'setup' | 'requestingFullscreen' | 'takingTest';

export const ResumeAssessment: React.FC<ResumeAssessmentProps> = ({ setPage }) => {
    const [domain, setDomain] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [level, setLevel] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [questions, setQuestions] = useState<any[] | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [score, setScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [timeLeft, setTimeLeft] = useState(450); // 7.5 minutes
    
    const [assessmentState, setAssessmentState] = useState<AssessmentState>('setup');
    const [hasAgreed, setHasAgreed] = useState(false);

    const handleForceExit = useCallback(() => {
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
    }, [setPage]);

    useEffect(() => {
        const handleFullScreenChange = () => {
            if (assessmentState === 'takingTest' && !document.fullscreenElement) {
                handleForceExit();
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [assessmentState, handleForceExit]);


    const handleGenerateQuestions = useCallback(async () => {
        if (!resumeFile) {
            setError("Resume file is missing.");
            setAssessmentState('setup');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const extractedResumeText = await extractTextFromPdf(resumeFile);
            
            if (!extractedResumeText.trim()) {
                throw new Error("Could not extract any text from the PDF. It might be an image-based resume.");
            }
            
            localStorage.setItem('assessmentConfig', JSON.stringify({
                role: selectedRole,
                resumeText: extractedResumeText,
                level: level,
                domain: domain,
            }));

            // Generate ALL questions for all assessments upfront
            const allQuestions = await generateAllPersonalizedQuestions(extractedResumeText, selectedRole, level, domain);
            
            // Store all questions for subsequent components
            localStorage.setItem('personalizedQuestions', JSON.stringify(allQuestions));

            // Set questions for this component
            setQuestions(allQuestions.resume_questions);
            setAssessmentState('takingTest');
        } catch (err: any) {
            console.error("Failed to generate questions:", err);
            setError(err.message || "Sorry, the AI couldn't generate questions. Please try again.");
            setAssessmentState('setup'); // Revert to setup if AI call fails
        } finally {
            setIsLoading(false);
        }
    }, [selectedRole, level, domain, resumeFile]);

    const handleSubmitAnswers = useCallback(() => {
        if (!questions) return;
        let correctAnswers = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answerIndex) {
                correctAnswers++;
            }
        });
        const calculatedScore = (correctAnswers / questions.length) * 10;
        setScore(calculatedScore);
        localStorage.setItem('resumeAnalysis', JSON.stringify({ score: calculatedScore, maxScore: 10, questions: questions.length }));
    }, [answers, questions]);

    // Timer logic
    useEffect(() => {
        if (assessmentState !== 'takingTest' || score !== null) return;

        if (timeLeft <= 0) {
            handleSubmitAnswers();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, assessmentState, score, handleSubmitAnswers]);
    
    const handleStartAssessment = () => {
        if (!selectedRole || !level || !domain || !resumeFile) {
            setError('Please complete all steps and upload your resume.');
            return;
        }
        setError(null);
        setAssessmentState('requestingFullscreen');
    };

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen()
            .then(() => {
                handleGenerateQuestions();
            })
            .catch(() => {
                setAssessmentState('setup'); // Revert if user denies fullscreen
            });
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files[0].type === "application/pdf") {
                setResumeFile(e.dataTransfer.files[0]);
                setError(null);
            } else {
                setError("Please upload a PDF file.");
            }
        }
    };
    
    const handleAnswerSelect = (qIndex: number, aIndex: number) => {
        setAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
    };
    
    if (score !== null) {
        return (
             <div className="text-center animate-fade-in">
                <h2 className="text-3xl font-bold text-primary-400 mb-4">Resume Assessment Complete</h2>
                <p className="text-xl mb-2">Your Score:</p>
                <p className="text-5xl font-bold mb-6">{score.toFixed(1)} <span className="text-3xl text-gray-400">/ 10</span></p>
                <p className="text-gray-300 mb-8">Your results have been saved. Let's move on to the next section.</p>
                <Button onClick={() => setPage('prep-hr')}>
                    Next: HR Questions <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )
    }

    if (assessmentState === 'setup') {
        return (
            <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-center mb-2">Step 1: Resume Assessment</h2>
                <p className="text-center text-gray-400 mb-6">Tell us about your goals to generate personalized technical questions.</p>
                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                
                <div className="space-y-6 max-w-lg mx-auto">
                     <div>
                        <label htmlFor="domain-select" className="block text-sm font-medium text-gray-300 mb-1">Step 1: Choose your Domain</label>
                        <select
                            id="domain-select"
                            value={domain}
                            onChange={(e) => {
                                setDomain(e.target.value);
                                setSelectedRole(''); // Reset role when domain changes
                            }}
                            className="w-full p-2 bg-surface border border-slate-600/80 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-200"
                        >
                            <option value="" disabled>-- Select a domain --</option>
                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {domain && (
                        <div className="animate-fade-in">
                            <label htmlFor="role-select" className="block text-sm font-medium text-gray-300 mb-1">Step 2: Choose your Target Role</label>
                            <select
                                id="role-select"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full p-2 bg-surface border border-slate-600/80 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-200"
                            >
                                <option value="" disabled>-- Select a role --</option>
                                {domainToRoles[domain].map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                    )}

                    {selectedRole && (
                        <div className="animate-fade-in">
                            <label htmlFor="level-select" className="block text-sm font-medium text-gray-300 mb-1">Step 3: Select your Current Level</label>
                            <select
                                id="level-select"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full p-2 bg-surface border border-slate-600/80 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-200"
                            >
                                <option value="" disabled>-- Select a level --</option>
                                {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <div 
                        onDragEnter={(e) => handleDragEvents(e, true)}
                        onDragLeave={(e) => handleDragEvents(e, false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isDragging ? 'border-primary-500 bg-surface-accent' : 'border-slate-600/80 bg-surface/50 hover:bg-surface-accent'
                        }`}
                    >
                        <input type="file" id="resume-upload" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloudIcon className="w-10 h-10 mb-3 text-gray-400"/>
                            {resumeFile ? (
                                <>
                                    <p className="font-semibold text-primary-300">File Selected</p>
                                    <p className="text-sm text-gray-400">{resumeFile.name}</p>
                                </>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">PDF only</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <Button onClick={handleStartAssessment} disabled={!domain || !selectedRole || !level || !resumeFile}>
                        Generate Questions
                    </Button>
                </div>
            </div>
        );
    }
    
    if (assessmentState === 'requestingFullscreen') {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 mb-4">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                <h2 className="text-3xl font-bold text-primary-400 mb-3">Focus Mode Required</h2>
                <p className="text-gray-300 mb-6 max-w-lg">To ensure integrity, this timed section must be completed in full-screen.<br/><strong className="text-yellow-400 mt-2 block">Exiting full-screen will terminate your assessment.</strong></p>
                <div className="flex items-center justify-center mb-6">
                    <input id="fullscreen-agree" type="checkbox" checked={hasAgreed} onChange={() => setHasAgreed(!hasAgreed)}
                        className="h-4 w-4 text-primary-600 bg-surface border-slate-600/80 rounded focus:ring-primary-600"/>
                    <label htmlFor="fullscreen-agree" className="ml-2 text-sm text-gray-300">I understand and agree to enter full-screen mode.</label>
                </div>
                <Button onClick={enterFullScreen} size="lg" disabled={!hasAgreed || isLoading} isLoading={isLoading}>
                    {isLoading ? "Analyzing Resume & Generating Questions..." : "Start Assessment"}
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <Loader message="Analyzing your profile and generating all personalized assessment questions..." />;
    }

    if (assessmentState === 'takingTest' && questions) {
        return (
            <div className="animate-fade-in relative">
                <div className="absolute top-0 right-0 bg-surface text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm border border-slate-700">
                    Time Left: {formatTime(timeLeft)}
                </div>
                <h2 className="text-2xl font-bold text-center mb-6">Custom Technical Questions</h2>
                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <Card key={qIndex}>
                             <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                             <div className="space-y-2">
                                {q.options.map((opt: string, aIndex: number) => (
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
                    <Button onClick={handleSubmitAnswers} disabled={Object.keys(answers).length !== questions.length}>
                        Submit & See Score
                    </Button>
                </div>
            </div>
        );
    }

    return <Loader message="Preparing your assessment..."/>
};