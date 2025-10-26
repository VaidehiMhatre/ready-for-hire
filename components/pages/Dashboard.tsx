import React, { useState, useEffect } from 'react';
import type { Page, FinalReport, AssessmentResults } from '../../types';
import { generateFinalReport } from '../../services/geminiService';
import { generatePdf } from '../../utils/pdfGenerator';
import { Button, Loader, Card, DownloadIcon, CheckCircleIcon, TrendingUpIcon } from '../ui';

interface DashboardProps {
    setPage: (page: Page) => void;
}

const defaultReport: FinalReport = {
    summary: "This is a sample report. You've completed the assessments, showing initiative. Focus on practicing behavioral questions and building portfolio projects.",
    consolidatedStrengths: ["Proactiveness", "Willingness to learn"],
    areasForImprovement: ["Behavioral interview skills", "Practical project experience"],
    careerRoadmap: [
        { step: "Learn Programming Fundamentals", description: "Master basics like variables, loops, and functions in a language like Python or JavaScript." },
        { step: "Build Small Projects", description: "Create practical applications like a to-do list or weather app to apply your knowledge." },
        { step: "Learn Version Control & GitHub", description: "Master Git to showcase your projects and collaborate with others."}
    ],
    resumeImprovements: [
        { area: "Quantify Achievements", suggestion: "Use metrics, e.g., 'Reduced page load time by 30%'."}
    ],
    sampleProjects: [
        { name: "Portfolio Website", description: "Build a responsive website to showcase your skills, projects, and contact information.", technologies: ["HTML", "CSS", "JavaScript"] },
        { name: "To-Do List App", description: "Create a to-do list app with features for adding, editing, and deleting tasks.", technologies: ["React", "JavaScript", "CSS"]}
    ],
    suggestedCertifications: [
        { name: "AWS Certified Cloud Practitioner", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/"}
    ],
    resources: [
        { name: "freeCodeCamp", url: "https://www.freecodecamp.org" }
    ]
};

const ProgressBar: React.FC<{label: string, value: number, max: number}> = ({ label, value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-gray-300">{label}</span>
                <span className="text-sm font-medium text-gray-300">{value > 0 ? `${value.toFixed(1)} / ${max}` : `- / ${max}`}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full" style={{width: `${percentage}%`}}></div>
            </div>
        </div>
    )
}

const Tag: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <span className="bg-primary-950/70 text-primary-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full border border-primary-800">
        {children}
    </span>
);

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
    const [report, setReport] = useState<FinalReport | null>(null);
    const [results, setResults] = useState<AssessmentResults | null>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aggregateScore, setAggregateScore] = useState(0);

    useEffect(() => {
        const fetchResultsAndAnalyze = async () => {
            try {
                const resumeData = JSON.parse(localStorage.getItem('resumeAnalysis') || '{}');
                const hrData = JSON.parse(localStorage.getItem('hrAnalysis') || '{}');
                const voiceData = JSON.parse(localStorage.getItem('voiceAnalysis') || '{}');
                const essayData = JSON.parse(localStorage.getItem('essayAnalysis') || '{}');

                const allResults: AssessmentResults = { resume: resumeData, hr: hrData, voice: voiceData, essay: essayData };
                setResults(allResults);

                // Calculate Aggregate Score
                let totalScore = 0;
                let totalMaxScore = 0;
                if (resumeData.score !== undefined) {
                    totalScore += resumeData.score;
                    totalMaxScore += 10;
                }
                if (hrData.score !== undefined) {
                    totalScore += hrData.score;
                    totalMaxScore += 10;
                }
                if (voiceData.score !== undefined) {
                    totalScore += voiceData.score;
                    totalMaxScore += 10;
                }
                if (essayData.score !== undefined) {
                    totalScore += essayData.score;
                    totalMaxScore += 10;
                }
                setAggregateScore(totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0);


                const completedCount = Object.values(allResults).filter(r => r && r.score !== undefined).length;
                if (completedCount < 4) {
                     setReport(defaultReport);
                     setError("Some assessments are not complete. The report below is a sample based on your completed sections.");
                     return;
                }
                
                const configStr = localStorage.getItem('assessmentConfig');
                if (!configStr) {
                    throw new Error("Assessment configuration not found. Please start from the resume step.");
                }
                const { role } = JSON.parse(configStr);

                const finalReport = await generateFinalReport(allResults, role);
                setReport(finalReport);
            } catch (err: any) {
                console.error("Final analysis failed:", err);
                setError(`Analysis failed: ${err.message}. Showing default recommendations.`);
                setReport(defaultReport);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResultsAndAnalyze();
    }, []);

    if (isLoading) {
        return <Loader message="Performing a final meta-analysis of all your results..." />;
    }
    
    return (
        <div className="animate-fade-in" id="final-report-container">
            {error && <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-md mb-6 text-center">{error}</div>}
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-primary-400">Your Final Report</h2>
                <Button onClick={() => generatePdf('final-report-container', 'placement-prep-report')} className="no-print">
                    <DownloadIcon className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Assessment Progress</h3>
                        <div className="space-y-4">
                             <ProgressBar label="Resume MCQs" value={results?.resume?.score ?? 0} max={10} />
                             <ProgressBar label="HR Questions" value={results?.hr?.score ?? 0} max={10} />
                             <ProgressBar label="Voice Assessment" value={results?.voice?.score ?? 0} max={10} />
                             <ProgressBar label="Essay Writing" value={results?.essay?.score ?? 0} max={10} />
                        </div>
                         <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                             <span className="text-base font-bold text-white">Aggregate Score</span>
                             <p className="text-5xl font-bold text-secondary-400 mt-1">{aggregateScore.toFixed(0)}%</p>
                         </div>
                    </Card>
                    
                    {report?.resumeImprovements && (
                         <Card>
                            <h4 className="text-xl font-semibold text-white mb-3">Resume Quick Fixes</h4>
                            <div className="space-y-3">
                            {report.resumeImprovements.map((item, i) => (
                                <div key={i}>
                                    <h5 className="font-semibold text-primary-300">{item.area}</h5>
                                    <p className="text-gray-400 text-sm">{item.suggestion}</p>
                                </div>
                            ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                     <Card>
                         <h3 className="text-xl font-semibold text-white mb-2">Overall Analysis</h3>
                         <div className="p-4 bg-primary-950/50 rounded-lg border border-primary-800/50">
                            <h4 className="font-bold text-primary-300">Summary</h4>
                            <p className="text-gray-300">{report?.summary}</p>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                                <h4 className="font-semibold text-white mb-2">Key Strengths</h4>
                                <ul className="space-y-2">
                                    {report?.consolidatedStrengths.map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300">
                                            <CheckCircleIcon className="w-5 h-5 mr-2 text-secondary-500 flex-shrink-0"/> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-2">Areas for Improvement</h4>
                                <ul className="space-y-2">
                                    {report?.areasForImprovement.map((item, i) => (
                                         <li key={i} className="flex items-center text-gray-300">
                                            <TrendingUpIcon className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0"/> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                         </div>
                     </Card>
                </div>
            </div>

            {report?.careerRoadmap && (
                 <div className="mt-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Your Career Roadmap</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.careerRoadmap.map((item, i) => (
                            <div key={i} className={`bg-surface/70 border border-slate-700 rounded-lg p-4 relative border-t-2 ${i === 0 ? 'border-accent-500' : i === 1 ? 'border-primary-500' : 'border-secondary-500'}`}>
                                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${i === 0 ? 'bg-accent-600' : i === 1 ? 'bg-primary-600' : 'bg-secondary-600'}`}>{i+1}</div>
                                <h4 className="font-semibold text-white mt-4">{item.step}</h4>
                                <p className="text-gray-400 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
           
            {report?.sampleProjects && (
                 <div className="mt-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Sample Beginner Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.sampleProjects.map((proj, i) => (
                            <Card key={i}>
                                <h4 className="font-semibold text-primary-300">{proj.name}</h4>
                                <p className="text-gray-400 text-sm mb-3">{proj.description}</p>
                                <div>
                                    {proj.technologies.map(tech => <Tag key={tech}>{tech}</Tag>)}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {report?.suggestedCertifications && (
                    <Card>
                        <h4 className="text-xl font-semibold text-white mb-3">Suggested Certifications</h4>
                        <ul className="space-y-2 text-primary-400">
                            {report.suggestedCertifications.map((cert, i) => (
                                <li key={i}><a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{cert.name}</a></li>
                            ))}
                        </ul>
                    </Card>
                )}
                {report?.resources && (
                    <Card>
                        <h4 className="text-xl font-semibold text-white mb-3">Suggested Resources</h4>
                        <ul className="space-y-2 text-primary-400">
                            {report.resources.map((res, i) => (
                                <li key={i}><a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{res.name}</a></li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            <div className="mt-8 text-center no-print">
                <Button onClick={() => setPage('home')} variant="secondary">Back to Home</Button>
            </div>
        </div>
    );
};