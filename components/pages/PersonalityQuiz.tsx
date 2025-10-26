import React, { useState, useEffect, useCallback } from 'react';
import type { Page, CareerReport } from '../../types';
import { analyzeQuiz } from '../../services/geminiService';
import { generatePdf } from '../../utils/pdfGenerator';
import { Button, Loader, Card, DownloadIcon } from '../ui';

interface PersonalityQuizProps {
    setPage: (page: Page) => void;
}

const quizQuestions = [
    { id: 'q1', text: 'A major project deadline is suddenly moved up by a week. How do you primarily react?', options: ['Immediately re-prioritize tasks and create a new, aggressive timeline.', 'Consult with the team to distribute the new workload and brainstorm shortcuts.', 'Analyze the project scope to see what can be trimmed or simplified to meet the new deadline.', 'Feel a surge of pressure, but focus on methodically working through the plan one step at a time.'] },
    { id: 'q2', text: 'When learning a complex new system, your preferred method is:', options: ['Following a structured, official course from start to finish.', 'Deconstructing a working example to understand how its components interact.', 'Reading the core documentation to grasp the fundamental principles first.', 'Jumping in and experimenting, learning through trial and error.'] },
    { id: 'q3', text: 'You are presented with a large, messy dataset. What is your first instinct?', options: ['To find patterns and correlations that could lead to unexpected insights.', 'To clean, structure, and document the data for future use.', 'To build a visualization or dashboard to make the data understandable to others.', 'To question the data\'s source and integrity before proceeding.'] },
    { id: 'q4', text: 'A team member strongly criticizes your proposed solution in a group meeting. You are most likely to:', options: ['Defend your reasoning and provide data to back up your approach.', 'Ask them to elaborate on their concerns to better understand their perspective.', 'Acknowledge their point and suggest an offline discussion to find a compromise.', 'Feel personally challenged and focus on finding flaws in their argument.'] },
    { id: 'q5', text: 'Which of these tasks would give you the most satisfaction?', options: ['Automating a repetitive, time-consuming manual process.', 'Designing an elegant and intuitive user interface for a complex application.', 'Optimizing a piece of code to run 10x faster.', 'Architecting a robust, scalable backend system from the ground up.'] },
    { id: 'q6', text: 'When working on a team project, you naturally gravitate towards:', options: ['Organizing the project board, defining tasks, and tracking progress.', 'Focusing on your assigned piece of the puzzle, ensuring it is of the highest quality.', 'Facilitating communication, resolving conflicts, and ensuring everyone is heard.', 'Exploring innovative or unconventional approaches to the problem.'] },
    { id: 'q7', text: 'You\'ve spent days on a problem and are completely stuck. What is your next move?', options: ['Systematically document everything you\'ve tried and ask a senior colleague for guidance.', 'Take a break and switch to a completely different type of task for a while.', 'Start from scratch, questioning every assumption you\'ve made so far.', 'Use a "brute force" method to try every possible solution, however inefficient.'] },
    { id: 'q8', text: 'A non-technical stakeholder wants a "simple" feature that you know is technically very complex. You:', options: ['Explain the technical challenges in detail to manage their expectations.', 'Propose a simpler, alternative solution that achieves a similar business goal.', 'Agree to their request but build a simplified version first as a prototype.', 'Provide a detailed breakdown of the time and resources required to build it exactly as requested.'] },
    { id: 'q9', text: 'The ideal end-state of a project for you is:', options: ['A product that is loved by users and receives glowing reviews.', 'A system that is stable, well-documented, and easy for other developers to maintain.', 'A solution that demonstrably moves a key business metric.', 'An innovative piece of technology that pushes technical boundaries.'] },
    { id: 'q10', text: 'Your approach to risk is best described as:', options: ['Calculated: I take risks if the potential reward is high and I have a mitigation plan.', 'Cautious: I prefer proven methods and technologies to minimize unexpected issues.', 'Experimental: I believe that without risk, there is no innovation or significant progress.', 'Collaborative: I discuss potential risks with the team to make a collective decision.'] },
];

const defaultReport: CareerReport = {
    jobRole: "Full-Stack Developer",
    strengths: ["Versatility", "Problem-Solving", "Adaptability"],
    roadmap: [
        { step: "Learn HTML, CSS, & JavaScript", description: "Master the fundamental building blocks of the web." },
        { step: "Pick a Frontend Framework", description: "Learn a modern framework like React or Vue.js." },
        { step: "Learn a Backend Language", description: "Master a server-side language like Node.js, Python, or Go." },
        { step: "Build Full-Stack Projects", description: "Create applications that connect a frontend to a backend with a database." }
    ],
    projects: [
        { name: "Personal Portfolio Website", description: "Showcase your skills and projects with a dynamic, self-built site." },
        { name: "To-Do List App with a Database", description: "A classic project to understand CRUD (Create, Read, Update, Delete) operations." }
    ],
    resources: [
        { name: "freeCodeCamp", url: "https://www.freecodecamp.org" },
        { name: "The Odin Project", url: "https://www.theodinproject.com" }
    ]
};

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ setPage }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<CareerReport | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeQuiz(answers);
            setReport(result);
        } catch (err) {
            console.error("AI analysis failed:", err);
            setError("The AI analysis failed. Displaying a default report as a fallback.");
            setReport(defaultReport);
        } finally {
            setIsLoading(false);
        }
    }, [answers]);
    
    useEffect(() => {
        if (report || isLoading) return; 

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, report, isLoading, handleSubmit]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };

    if (isLoading) {
        return <Loader message="Analyzing your personality to find the perfect tech role..." />;
    }

    if (report) {
        return (
            <div className="animate-fade-in" id="report-container">
                {error && <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-md mb-4 text-center">{error}</div>}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-primary-400">Your Career Report</h2>
                    <Button onClick={() => generatePdf('report-container', 'career-report')} className="no-print">
                        <DownloadIcon className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>

                <Card className="mb-6" borderColor="primary">
                    <h3 className="text-2xl font-semibold mb-2 text-white">Suggested Role: <span className="text-primary-300">{report.jobRole}</span></h3>
                    <p className="text-gray-300">Based on your answers, this role aligns well with your motivations and work style.</p>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card borderColor="secondary">
                        <h4 className="text-xl font-semibold text-white mb-3">Key Strengths</h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                            {report.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                        </ul>
                    </Card>
                    <Card borderColor="accent">
                        <h4 className="text-xl font-semibold text-white mb-3">Learning Resources</h4>
                        <ul className="space-y-2 text-primary-400">
                            {report.resources.map((res, i) => (
                                <li key={i}><a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{res.name}</a></li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <Card className="mt-6">
                    <h4 className="text-xl font-semibold text-white mb-3">Beginner's Roadmap</h4>
                    <ol className="relative border-l border-slate-700">
                        {report.roadmap.map((item, i) => (
                            <li key={i} className="mb-6 ml-4">
                                <div className="absolute w-3 h-3 bg-primary-500 rounded-full mt-1.5 -left-1.5 border border-background"></div>
                                <h5 className="font-semibold text-white">{item.step}</h5>
                                <p className="text-gray-400">{item.description}</p>
                            </li>
                        ))}
                    </ol>
                </Card>
                
                <Card className="mt-6">
                    <h4 className="text-xl font-semibold text-white mb-3">Sample Projects</h4>
                     {report.projects.map((proj, i) => (
                        <div key={i} className="mb-4 last:mb-0">
                            <h5 className="font-semibold text-primary-300">{proj.name}</h5>
                            <p className="text-gray-400">{proj.description}</p>
                        </div>
                    ))}
                </Card>
                <div className="mt-8 text-center no-print">
                    <Button onClick={() => setPage('home')} variant="secondary">Back to Home</Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in relative">
             <div className="absolute top-0 right-0 bg-surface text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm border border-slate-700">
                Time Left: {formatTime(timeLeft)}
            </div>
            <h2 className="text-2xl font-bold text-center mb-6">Career Explorer Quiz</h2>
            <form onSubmit={handleFormSubmit} className="space-y-8">
                {quizQuestions.map((q, index) => (
                    <Card key={q.id}>
                        <label className="block text-lg font-medium text-gray-100 mb-4">{index + 1}. {q.text}</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {q.options.map(opt => (
                                <label key={opt} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-primary-900/80 border-primary-500' : 'bg-surface border-slate-700 hover:bg-surface-accent'}`}>
                                    <input
                                        type="radio"
                                        name={q.id}
                                        value={opt}
                                        checked={answers[q.id] === opt}
                                        onChange={() => handleAnswerChange(q.id, opt)}
                                        className="h-4 w-4 text-primary-600 bg-background border-gray-500 focus:ring-primary-600"
                                    />
                                    <span className="ml-3 text-gray-200">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                ))}
                <div className="flex justify-between items-center">
                   <Button onClick={() => setPage('home')} variant="secondary">Back to Home</Button>
                   <Button type="submit" disabled={Object.keys(answers).length !== quizQuestions.length}>
                        Get My Career Report
                    </Button>
                </div>
            </form>
        </div>
    );
};