import React, { useState, useRef, useEffect } from 'react';
import type { Page } from '../../types';
import { transcribeAndAnalyzeAudio } from '../../services/geminiService';
import { Button, Loader, Card, ArrowRightIcon, MicIcon, StopCircleIcon } from '../ui';

interface VoiceAssessmentProps {
    setPage: (page: Page) => void;
}

interface Prompt {
    id: number;
    text: string;
}

interface AnalysisResult {
    analyses: {
        prompt: string;
        transcription: string;
        feedback: string;
        score: number;
    }[];
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const VoiceAssessment: React.FC<VoiceAssessmentProps> = ({ setPage }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [promptsLoading, setPromptsLoading] = useState(true);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlobs, setAudioBlobs] = useState<{ [key: number]: { blob: Blob, mimeType: string} }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        const loadPrompts = () => {
            setError(null);
            try {
                const allQuestionsStr = localStorage.getItem('personalizedQuestions');
                if (!allQuestionsStr) {
                    throw new Error("Personalized questions not found. Please start from the resume step.");
                }
                const { voice_prompts } = JSON.parse(allQuestionsStr);
                 if (!voice_prompts) {
                    throw new Error("Voice prompts are missing from the assessment data.");
                }
                setPrompts(voice_prompts.map((text: string, index: number) => ({ id: index, text })));
            } catch (err: any) {
                console.error("Failed to load voice prompts:", err);
                setError(err.message || "Could not load personalized voice prompts.");
            } finally {
                setPromptsLoading(false);
            }
        };

        loadPrompts();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        setError(null);
        if(audioBlobs[currentPromptIndex]) {
            setAudioBlobs(prev => {
                const newBlobs = {...prev};
                delete newBlobs[currentPromptIndex];
                return newBlobs;
            })
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const mimeType = recorder.mimeType;
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlobs(prev => ({ ...prev, [currentPromptIndex]: {blob: audioBlob, mimeType} }));
                audioChunksRef.current = [];
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check your browser permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };
    
    const handleNextPrompt = () => {
        setCurrentPromptIndex(prev => prev + 1);
        setError(null);
    }
    
    const handleAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        try {
             const analysisPayload = await Promise.all(
                prompts.map(async (p) => {
                    const audioInfo = audioBlobs[p.id];
                    if (!audioInfo) throw new Error(`Audio for prompt ${p.id+1} is missing.`);
                    const base64Audio = await blobToBase64(audioInfo.blob);
                    return {
                        prompt: p.text,
                        audio: { mimeType: audioInfo.mimeType, data: base64Audio }
                    };
                })
            );

            const analysisResult = await transcribeAndAnalyzeAudio(analysisPayload);
            setResult(analysisResult);
            
            // Calculate average score for dashboard
            const avgScore = analysisResult.analyses.reduce((acc, curr) => acc + curr.score, 0) / analysisResult.analyses.length;
            const unifiedFeedback = analysisResult.analyses.map(a => a.feedback).join(' ');
            localStorage.setItem('voiceAnalysis', JSON.stringify({ ...analysisResult, score: avgScore, feedback: unifiedFeedback }));

        } catch(err: any) {
            console.error("Voice analysis failed:", err);
            setError(`Sorry, the AI analysis failed: ${err.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }
    
    if (promptsLoading) return <Loader message="Loading personalized voice prompts..." />;

    if(isLoading) return <Loader message="Transcribing and analyzing your speech..."/>

    if(result) {
        const avgScore = result.analyses.reduce((acc, curr) => acc + curr.score, 0) / result.analyses.length;
        return (
            <div className="animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-primary-400 mb-2">Voice Assessment Complete</h2>
                <p className="text-gray-300 mb-6">Here's a breakdown of your performance for each question.</p>
                
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
                                <p className="text-gray-300 mb-3">{analysis.feedback}</p>
                                <h4 className="font-semibold text-gray-200">Your Transcription:</h4>
                                <p className="text-gray-400 italic bg-surface/50 p-2 rounded-md">"{analysis.transcription}"</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-8">
                     <p className="text-xl">Your Average Score: <span className="font-bold text-primary-300">{avgScore.toFixed(1)}/10</span></p>
                </div>
                
                <Button onClick={() => setPage('prep-essay')} className="mt-6">
                    Next: Essay Writing <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-2">Step 3: Voice Assessment</h2>
            <p className="text-center text-gray-400 mb-6">Record your answer for each personalized prompt. The AI will transcribe and analyze your speech.</p>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            
            {prompts.length > 0 ? (
                <>
                     <div className="w-full bg-surface rounded-full h-2.5 mb-6 border border-slate-700">
                        <div className="bg-primary-600 h-2 rounded-full m-px" style={{ width: `${((currentPromptIndex + 1) / prompts.length) * 100}%` }}></div>
                    </div>
                    
                    <Card className="text-center" borderColor="primary">
                        <p className="text-lg text-gray-100 mb-2 font-semibold">Prompt {currentPromptIndex + 1} of {prompts.length}</p>
                        <p className="text-md text-gray-300 mb-6">{prompts[currentPromptIndex]?.text}</p>
                        <Button 
                            onClick={isRecording ? stopRecording : startRecording}
                            variant={isRecording ? 'secondary' : 'primary'}
                            className="w-36"
                        >
                            {isRecording ? <><StopCircleIcon className="mr-2 h-5 w-5"/> Stop</> : <><MicIcon className="mr-2 h-5 w-5"/> Record</>}
                        </Button>
                        {isRecording && <p className="mt-4 text-primary-400 animate-pulse">Recording... {recordingTime}s</p>}
                        {!isRecording && audioBlobs[currentPromptIndex] && <p className="mt-4 text-green-400">Recording {currentPromptIndex + 1} saved.</p>}
                    </Card>
                    
                    <div className="mt-6 flex justify-end">
                        {currentPromptIndex < prompts.length - 1 ? (
                            <Button onClick={handleNextPrompt} disabled={isRecording || !audioBlobs[currentPromptIndex]}>
                                Next Prompt <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleAnalysis} disabled={isRecording || Object.keys(audioBlobs).length < prompts.length}>
                                Finish & Analyze Speech
                            </Button>
                        )}
                    </div>
                </>
            ) : !error && (
                <Loader message="Loading prompts..."/>
            )}
        </div>
    );
};
