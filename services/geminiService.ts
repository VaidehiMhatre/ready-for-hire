import { GoogleGenAI, Type } from "@google/genai";
import type { CareerReport, FinalReport } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const careerReportSchema = {
    type: Type.OBJECT,
    properties: {
        jobRole: { type: Type.STRING, description: "A suggested job role for the user." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the user's key strengths." },
        roadmap: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    step: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['step', 'description']
            },
            description: "A beginner's roadmap with clear steps."
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['name', 'description']
            },
            description: "Sample project ideas."
        },
        resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    url: { type: Type.STRING }
                },
                required: ['name', 'url']
            },
            description: "Links to learning resources."
        },
    },
    required: ['jobRole', 'strengths', 'roadmap', 'projects', 'resources']
};

export const analyzeQuiz = async (answers: Record<string, string>): Promise<CareerReport> => {
    const prompt = `Based on these personality quiz answers, generate a personalized career recommendation report. The user's answers are: ${JSON.stringify(answers, null, 2)}. Provide a specific job role, key strengths, a beginner's roadmap, sample projects, and learning resources.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: careerReportSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateAllPersonalizedQuestions = async (resumeText: string, role: string, level: string, domain: string): Promise<{ resume_questions: any[], hr_questions: any[], voice_prompts: string[], essay_prompts: string[] }> => {
    const prompt = `You are an intelligent Interview Question Generator for a placement readiness platform. Your task is to generate a full set of professional assessment questions by analyzing a candidate's uploaded resume.

---
📄 Input Parameters:
1. resume_text: """${resumeText}"""
2. target_role: "${role}"
3. domain: "${domain}"
4. skill_level: "${level}"
---

⚙️ Processing Instructions:
1.  **Analyze the resume_text** to identify key projects, internships, skills, and achievements.
2.  **Generate questions that directly reference these elements.** Use project names and technologies.
3.  **Adjust question complexity** based on skill_level (Beginner: simple explanations; Intermediate: reasoning/scenarios; Expert: optimization/strategy).
4.  Each question must be **short (max 2 lines)**, professional, and sound like a real interviewer.

---
🎯 Output Requirements:
- **10 technical resume questions** in multiple-choice format (question, 4 options, answer index).
- **10 HR situational questions** in multiple-choice format (scenario, 4 plausible action-oriented options).
- **2 open-ended Voice prompts** for verbal assessment.
- **2 open-ended Essay prompts** for written assessment.
- All questions must feel personalized to the candidate's background.

---
💡 Example Question Logic:
If resume mentions a "Placement Readiness Analyzer" project:
- A good resume question would test a technology used in it (e.g., Streamlit).
- A good HR question would be: "Your Placement Analyzer project seems interesting. If a stakeholder requested a feature you knew was technically unfeasible with Streamlit, how would you handle the conversation?"
- A good voice prompt would be: "Walk me through the most challenging technical problem you solved while building your Placement Readiness Analyzer."
---
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    resume_questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                                answerIndex: { type: Type.INTEGER }
                            },
                             required: ['question', 'options', 'answerIndex']
                        },
                        minItems: 10,
                        maxItems: 10,
                    },
                    hr_questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }
                            },
                            required: ['question', 'options']
                        },
                        minItems: 10,
                        maxItems: 10
                    },
                    voice_prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        minItems: 2,
                        maxItems: 2
                    },
                    essay_prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        minItems: 2,
                        maxItems: 2
                    }
                },
                required: ['resume_questions', 'hr_questions', 'voice_prompts', 'essay_prompts']
            },
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const analyzeHRAnswers = async (questions: { question: string, options: string[] }[], userAnswers: number[], role: string): Promise<{ feedback: string[]; score: number }> => {
    const prompt = `A candidate applying for a "${role}" role answered a set of situational questions. Evaluate their choices based on professional conduct, problem-solving skills, and team collaboration. Provide a final score out of 10 and concise, actionable feedback as a list of 2-3 short bullet points. Do not just state if an answer is right or wrong; explain the reasoning behind the evaluation.
    
    Here are the questions and the user's chosen answers:
    ${questions.map((q, i) => `
    Question ${i + 1}: ${q.question}
    User's Choice: "${q.options[userAnswers[i]]}"
    `).join('')}
    
    Based on this, generate the feedback as a list of strings and the score.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    feedback: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "A list of constructive, short feedback points on the user's choices." 
                    },
                    score: { type: Type.INTEGER, description: "A score from 1 to 10 based on the quality of judgment." }
                },
                required: ['feedback', 'score']
            },
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const transcribeAndAnalyzeAudio = async (audioData: { prompt: string, audio: {mimeType: string, data: string} }[]): Promise<{ analyses: { prompt: string; transcription: string; feedback: string; score: number }[] }> => {
    
    const audioParts = audioData.map(d => ({
        inlineData: {
            mimeType: d.audio.mimeType,
            data: d.audio.data
        }
    }));
    
    const prompt = `I will provide two audio clips of a user answering two different interview prompts. For each audio clip, provide a separate analysis. Each analysis must include:
    1. An accurate transcription of the user's spoken content.
    2. Concise feedback on verbal fluency, grammar, clarity, and relevance to the prompt.
    3. A score out of 10.
    
    The prompts were:
    Prompt 1: "${audioData[0].prompt}"
    Prompt 2: "${audioData[1].prompt}"
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                ...audioParts,
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analyses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING, description: "The original prompt for this audio clip." },
                                transcription: { type: Type.STRING, description: "The transcribed text from the audio." },
                                feedback: { type: Type.STRING, description: "Feedback on fluency, grammar, and clarity for this answer." },
                                score: { type: Type.INTEGER, description: "A score from 1 to 10 for this answer." }
                            },
                            required: ['prompt', 'transcription', 'feedback', 'score']
                        }
                    }
                },
                required: ['analyses']
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const analyzeEssay = async (essays: { prompt: string, text: string }[]): Promise<{ analyses: { prompt: string; feedback: string; score: number }[] }> => {
    const prompt = `Analyze these two user-written essays. For each essay, provide separate, concise feedback on clarity, structure, and articulation, and a separate score out of 10.
    
    Essay Prompt 1: "${essays[0].prompt}"
    Essay 1: "${essays[0].text}"

    Essay Prompt 2: "${essays[1].prompt}"
    Essay 2: "${essays[1].text}"
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analyses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING, description: "The original prompt for this essay." },
                                feedback: { type: Type.STRING, description: "Feedback on clarity and structure for this essay." },
                                score: { type: Type.INTEGER, description: "A score from 1 to 10 for this essay." }
                            },
                            required: ['prompt', 'feedback', 'score']
                        }
                    }
                },
                required: ['analyses']
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const generateFinalReport = async (results: any, role: string): Promise<FinalReport> => {
    const prompt = `Perform a meta-analysis on a user's performance across four assessments (Resume, HR, Voice, Essay) for a target role of "${role}". 
    
    Here is their performance data:
    - Resume Assessment Score: ${results.resume.score}/10
    - HR Questions Score: ${results.hr.score}/10
    - Voice Assessment Score: ${results.voice.score}/10
    - Essay Writing Score: ${results.essay.score}/10
    - HR Feedback: "${results.hr.feedback}"
    - Voice Feedback: "${results.voice.feedback}"
    - Essay Feedback: "${results.essay.feedback}"

    Based on all this data, generate a final report. The report MUST be concise, crisp, and highly readable. Use bullet points and short phrases instead of long paragraphs.
    1. A holistic summary (2-3 sentences max).
    2. A consolidated list of 3-4 key strengths.
    3. A list of 2-3 main areas for improvement.
    4. A 3-step career roadmap with brief, actionable descriptions.
    5. Two specific, actionable suggestions for their resume.
    6. Two project ideas suitable for their skill level, including a list of 2-4 relevant technologies for each.
    7. Two relevant certifications for their target role.
    8. Two relevant online learning resources.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    consolidatedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
                    careerRoadmap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { step: { type: Type.STRING }, description: { type: Type.STRING } },
                            required: ['step', 'description']
                        }
                    },
                    resumeImprovements: {
                         type: Type.ARRAY,
                         items: {
                            type: Type.OBJECT,
                            properties: { area: { type: Type.STRING }, suggestion: { type: Type.STRING } },
                            required: ['area', 'suggestion']
                         },
                         description: "Actionable feedback on the resume."
                    },
                    sampleProjects: {
                         type: Type.ARRAY,
                         items: {
                            type: Type.OBJECT,
                            properties: { 
                                name: { type: Type.STRING }, 
                                description: { type: Type.STRING },
                                technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                             },
                            required: ['name', 'description', 'technologies']
                         },
                         description: "Relevant project ideas."
                    },
                    suggestedCertifications: {
                        type: Type.ARRAY,
                        items: {
                           type: Type.OBJECT,
                           properties: { name: { type: Type.STRING }, url: { type: Type.STRING } },
                           required: ['name', 'url']
                        },
                        description: "Relevant certification suggestions."
                    },
                    resources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { name: { type: Type.STRING }, url: { type: Type.STRING } },
                            required: ['name', 'url']
                        },
                        description: "Links to suggested learning resources."
                    },
                },
                required: ['summary', 'consolidatedStrengths', 'areasForImprovement', 'careerRoadmap', 'resumeImprovements', 'sampleProjects', 'suggestedCertifications', 'resources']
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
