import { useEffect, useState } from 'react';
import { getResume } from '@/api/resume';
import type { ResumeData } from '../types';

export const useResume = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getResume().then((data) => {
      if (JSON.stringify(data) !== JSON.stringify(resumeData)) {
        setResumeData(data);
      }
      setIsLoading(false);
    });
  }, [resumeData]);

  return {
    resumeData,
    isLoading,
  };
};
