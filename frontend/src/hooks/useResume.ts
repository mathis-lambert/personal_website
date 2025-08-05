import { useCallback, useState } from 'react';
import { initialResumeData } from '../data';
import { callPersonalApi } from '@/api/personalApi.ts';
import type { IsLoadingState, ResumeData } from '../types';

type AiInteractionType = 'summary' | 'experience' | 'coverLetter' | 'funFact';

export const useResume = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isLoading, setIsLoading] = useState<IsLoadingState>({
    summary: false,
    experience: false,
    coverLetter: false,
    funFact: false,
    pdf: false,
  });
  const [jobDescription, setJobDescription] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');

  const handleAiInteraction = useCallback(
    async (type: AiInteractionType) => {
      setIsLoading((prev) => ({ ...prev, [type]: true }));
      let prompt = '';

      try {
        switch (type) {
          case 'summary': {
            prompt = `Rewrite this summary in a more professional tone, keeping it professional and under 50 words: "${resumeData.summary}"`;
            const newSummary = await callPersonalApi({
              input: prompt,
              history: [],
            });

            console.log('New summary:', newSummary);
            if (!newSummary || !newSummary.result) {
              setAiResponse('Failed to generate summary. Please try again.');
              return;
            }

            setResumeData((prev) => ({
              ...prev,
              summary: newSummary.result.replace(/"/g, ''),
            }));
            break;
          }

          case 'experience': {
            const expText = resumeData.experiences
              .map(
                (e) => `${e.role} at ${e.company}: ${e.description.join('. ')}`,
              )
              .join('\n');
            prompt = `Summarize the following career experience into a powerful, 2-sentence paragraph for a resume: \n${expText}`;
            const expSummary = await callPersonalApi({
              input: prompt,
              history: [],
            });

            console.log('Experience summary:', expSummary);
            if (!expSummary || !expSummary.result) {
              setAiResponse(
                'Failed to summarize experience. Please try again.',
              );
              return;
            }
            setAiResponse(expSummary.result);
            break;
          }
        }
      } catch (error) {
        console.error(`Error during AI interaction type "${type}":`, error);
        setAiResponse('An error occurred. Please try again.');
      } finally {
        setIsLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [resumeData],
  );

  return {
    resumeData,
    isLoading,
    setIsLoading,
    jobDescription,
    setJobDescription,
    aiResponse,
    handleAiInteraction,
  };
};
