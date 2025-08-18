import { useEffect, useState } from 'react';
import { getResume } from '@/api/resume';
import useAuth from '@/hooks/useAuth';
import type { ResumeData } from '../types';

export const useResume = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { token } = useAuth();

  useEffect(() => {
    getResume({ token: token ?? undefined }).then((data) => {
      if (JSON.stringify(data) !== JSON.stringify(resumeData)) {
        setResumeData(data);
      }
      setIsLoading(false);
    });
  }, [token, resumeData]);

  return {
    resumeData,
    isLoading,
  };
};
