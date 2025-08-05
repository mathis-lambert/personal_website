import type { ResumeData } from './types';

export const initialResumeData: ResumeData = {
  name: 'Mathis Lambert',
  contact: {
    email: 'mathis.lambert27@gmail.com',
    phone: '06 51 05 01 67',
    linkedin: 'mathis-lambert',
    website: 'mathislambert.fr',
  },
  summary:
    "I'm passionate about AI, machine learning, and data science, and I enjoy working on practical and innovative solutions within a collaborative environment. With a focus on continuous learning and technical reliability, I aim to grow through meaningful, hands-on projects.",
  experiences: [
    {
      role: 'Apprentice R&D Engineer (previously Intern)',
      company: 'Free Pro',
      period: 'Apr 2023 - Present',
      location: 'Marseille, France',
      highlight: true,
      isCurrent: true,
      description: [
        'Progressed from an R&D Intern to an Apprentice Engineer on the AI Research team.',
        'Gained expertise in transformer models (LLMs, TimeSeries), dataset design, and fine-tuning (SFT, DPO, LORA).',
        'Deployed AI workloads on HPC infrastructures (Nvidia H100 clusters) using Docker, Nvidia NGC, and Slurm.',
        'Developed OCR systems with DepthAI/Raspberry Pi and object detection models with OpenCV/YOLOv8.',
      ],
    },
    {
      role: 'Junior Web Developer & Webdesigner',
      company: 'LEXTAN',
      period: 'Jun 2022 - Aug 2022',
      location: 'Gémenos, France',
      description: [
        'Led the complete, from-scratch redesign and development of the corporate website.',
        'Developed tailored web solutions for major tech events like Vivatech and JDL Expo 2022.',
      ],
    },
    {
      role: 'IZZY - Award-Winning Startup Project',
      company: 'PÉPITE Provence & UN 2030 Goals',
      period: 'Mar 2018 - Apr 2018',
      location: 'Chicago, Illinois, USA',
      highlight: false,
      description: [
        'Co-developed an intelligent system to combat driver fatigue for long-haul truck drivers.',
        "Awarded 2nd Place Jury Prize at the Start'up Competition in Chicago.",
        'Designed a solution aligned with UN 2030 Sustainable Development Goals.',
      ],
    },
  ],
  education: [
    {
      institution: 'CPE Lyon',
      degree: 'Computer Science, Ingénierie informatique',
      period: '2024 - 2027',
    },
    {
      institution: 'Université de Toulon',
      degree: "Bachelor (BUT) Multimédia et Métiers de l'Internet",
      period: '2021 - 2024',
    },
  ],
  technologies: [
    'Python',
    'PyTorch',
    'LLMs (Mistral, Llama)',
    'HPC/Slurm',
    'Docker',
    'Nvidia NGC',
    'Node.js',
    'MongoDB',
    'React',
    'JavaScript/TypeScript',
    'Computer Vision (OpenCV, YOLO)',
  ],
  skills: [
    'AI & Machine Learning',
    'Fine-Tuning (LORA, DPO)',
    '5G SA Infrastructure',
    'Public Speaking',
    'Agile Methodologies',
    'Problem Solving',
  ],
  passions: [
    'Video Games',
    'Handball',
    'Motorbiking',
    'Mechanics',
    'Hardware Tinkering',
  ],
};
