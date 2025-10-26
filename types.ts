export type Page = 
  | 'home'
  | 'quiz'
  | 'prep-start'
  | 'prep-resume'
  | 'prep-hr'
  | 'prep-voice'
  | 'prep-essay'
  | 'prep-dashboard';

export interface CareerReport {
  jobRole: string;
  strengths: string[];
  roadmap: { step: string; description: string; }[];
  projects: { name: string; description: string; }[];
  resources: { name: string; url: string; }[];
}

export interface FinalReport {
  summary: string;
  consolidatedStrengths: string[];
  areasForImprovement: string[];
  careerRoadmap?: { step: string; description: string; }[];
  resumeImprovements?: { area: string; suggestion: string; }[];
  sampleProjects?: { name: string; description: string; technologies: string[]; }[];
  suggestedCertifications?: { name: string; url: string; }[];
  resources?: { name: string; url: string; }[];
}

export interface AssessmentResults {
    resume?: any;
    hr?: any;
    voice?: any;
    essay?: any;
}
