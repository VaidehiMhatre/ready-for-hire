import React from 'react';
import type { Page } from '../../types';
import { Card, Button, ArrowRightIcon } from '../ui';

interface HomeProps {
    setPage: (page: Page) => void;
}

export const Home: React.FC<HomeProps> = ({ setPage }) => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Choose Your Path</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="flex flex-col" borderColor="accent">
                    <h3 className="text-2xl font-semibold text-accent-400 mb-3">Path 1: Career Explorer</h3>
                    <p className="text-gray-300 mb-4 flex-grow">
                        Not sure where to start? Take a quick 10-question quiz to discover a tech role that fits your personality, work style, and motivations.
                    </p>
                    <Button onClick={() => setPage('quiz')} className="mt-auto w-full" variant='secondary'>
                        Start Personality Quiz
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                </Card>
                <Card className="flex flex-col" borderColor="primary">
                    <h3 className="text-2xl font-semibold text-primary-400 mb-3">Path 2: Placement Prep</h3>
                    <p className="text-gray-300 mb-4 flex-grow">
                        Preparing for job interviews? Go through a comprehensive assessment series covering your resume, behavioral questions, voice clarity, and writing skills.
                    </p>
                    <Button onClick={() => setPage('prep-resume')} className="mt-auto w-full">
                        Begin Placement Prep
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                </Card>
            </div>
        </div>
    );
};