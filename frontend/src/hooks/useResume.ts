import { useCallback, useState } from 'react';
import { initialResumeData } from '../data';
import { callGeminiAPI } from '../api/gemini';
import { IsLoadingState, ResumeData } from '../types';

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
          case 'summary':
            prompt = `Rewrite this summary in a more professional tone, keeping it professional and under 50 words: "${resumeData.summary}"`;
            const newSummary = await callGeminiAPI(prompt);
            setResumeData((prev) => ({
              ...prev,
              summary: newSummary.replace(/"/g, ''),
            }));
            break;

          case 'experience':
            const expText = resumeData.experiences
              .map(
                (e) => `${e.role} at ${e.company}: ${e.description.join('. ')}`,
              )
              .join('\n');
            prompt = `Summarize the following career experience into a powerful, 2-sentence paragraph for a resume: \n${expText}`;
            const expSummary = await callGeminiAPI(prompt);
            setAiResponse(expSummary);
            break;

          case 'funFact':
            prompt =
              'Tell me a fun, little-known fact about technology or computer science.';
            const funFact = await callGeminiAPI(prompt);
            setAiResponse(funFact);
            break;

          case 'coverLetter':
            if (!jobDescription.trim()) {
              setAiResponse('Please enter a job description first.');
              return;
            }
            const resumeString = `Name: ${resumeData.name}, Skills: ${[...resumeData.technologies, ...resumeData.skills].join(', ')}, Experience: ${resumeData.experiences.map((e) => `${e.role} at ${e.company}: ${e.description.join('. ')}`).join('; ')}`;
            prompt = `Based on this resume:\n---\n${resumeString}\n---\nAnd this job description:\n---\n${jobDescription}\n---\nWrite a professional, concise cover letter. Highlight relevant skills and experience. Address it to "Hiring Manager".`;
            const letter = await callGeminiAPI(prompt);
            setAiResponse(letter);
            break;
        }
      } catch (error) {
        console.error(`Error during AI interaction type "${type}":`, error);
        setAiResponse('An error occurred. Please try again.');
      } finally {
        setIsLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [resumeData, jobDescription],
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
