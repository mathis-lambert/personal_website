// src/components/ui/ExperienceTimeline.tsx
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState, WheelEvent } from 'react';

type Experience = {
  title: string;
  company: string;
  date: string;
  description: string;
};

const experiences: Experience[] = [
  {
    title: 'Apprenti Ingénieur R&D – Équipe Recherche IA',
    company: 'Free Pro',
    date: "sept. 2024 - aujourd'hui",
    description:
      'Travail sur les modèles Transformers (LLMs, séries temporelles) : conception de datasets, fine-tuning (SFT, DPO, LoRA) et évaluation. Déploiement de charges IA sur infrastructures HPC avec GPUs Nvidia H100, via Docker, Slurm et Nvidia NGC. Suivi de modèles open-source (Mistral, LLaMA), exploration des agents IA orientés entreprise, embeddings, Speech2Text et Doc2Vec.',
  },
  {
    title: 'Développeur R&D IA – Équipe Recherche IA',
    company: 'Free Pro',
    date: 'sept. 2023 - sept. 2024',
    description:
      'Participation active à des projets de R&D sur l’IA générative et l’optimisation HPC. Expériences en Computer Vision (OCR, DepthAI, YOLOv8), télécom (5G SA, GNodeB) et entraînement de modèles open-source sur clusters GPU. Maîtrise des workflows d’infrastructure et des outils associés.',
  },
  {
    title: 'Développeur Junior R&D',
    company: 'Free Pro',
    date: 'juin 2023 - sept. 2023',
    description:
      'Implémentation de POCs d’IA appliqués à des cas métiers internes. Travaux exploratoires sur la génération de texte, la synthèse vocale, et les représentations vectorielles (embeddings).',
  },
  {
    title: 'Développeur Web & Webdesigner',
    company: 'LEXTAN',
    date: 'juin 2022 - août 2022',
    description:
      'Refonte complète du site web de l’entreprise : UI/UX, développement from scratch et intégration responsive. Réalisation de solutions web sur mesure pour les salons Vivatech et JDL Expo.',
  },
  {
    title: 'Designer 3D – Scénographie CES',
    company: 'LEXTAN',
    date: 'janv. 2021',
    description:
      "Création de contenus 3D photoréalistes et animation vidéo pour le projet Autopod présenté au CES 2020. Collaboration sur la scénographie et le motion design pour renforcer l'impact visuel du stand.",
  },
  {
    title: 'Développeur Jeu Vidéo',
    company: 'ISART DIGITAL Paris',
    date: 'juin 2018 - juil. 2018',
    description:
      'Stage de deux semaines en développement de jeu vidéo (Unity). Conception d’un jeu complet avec mécaniques de gameplay et intégration visuelle. Renforcement des compétences en logique, créativité et développement logiciel.',
  },
  {
    title: 'Cofondateur – Projet IZZY (Startup Étudiante)',
    company: 'PÉPITE Provence',
    date: 'mars 2018 - avr. 2018',
    description:
      'Lauréat du 2ᵉ prix du jury lors de la compétition Start’up à Chicago. Développement d’un système intelligent de détection de somnolence pour routiers longue distance, en réponse aux Objectifs de Développement Durable de l’ONU.',
  },
];

const MOBILE_BREAKPOINT = 768;
const SCROLL_SPEED = 4;
const WHEEL_SENSITIVITY = 2; // Sensibilité de la molette

export function ExperienceTimeline() {
  const controls = useAnimation();
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const checkScreenSize = () =>
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isHovered || isMobile) {
      controls.start({
        y: '-50%',
        transition: {
          duration: experiences.length * SCROLL_SPEED,
          ease: 'linear',
          repeat: Infinity,
        },
      });
    }
  }, [controls, isHovered, isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      controls.stop();
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      // Reprendre le défilement depuis la position actuelle
      controls.start({
        y: '-50%',
        transition: {
          duration: experiences.length * SCROLL_SPEED,
          ease: 'linear',
          repeat: Infinity,
        },
      });
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!isMobile && isHovered && containerRef.current) {
      e.preventDefault();

      const container = containerRef.current;
      const scrollHeight = container.scrollHeight / 2; // Divisé par 2 car on duplique les éléments

      // Calculer la nouvelle position
      scrollPositionRef.current += e.deltaY * WHEEL_SENSITIVITY;

      // Gérer le bouclage
      if (scrollPositionRef.current > scrollHeight) {
        scrollPositionRef.current = scrollPositionRef.current % scrollHeight;
      } else if (scrollPositionRef.current < 0) {
        scrollPositionRef.current =
          scrollHeight + (scrollPositionRef.current % scrollHeight);
      }

      // Appliquer l'animation
      controls.set({ y: -scrollPositionRef.current });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden group touch-action-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {/* Gradients pour un effet de fondu en haut et en bas */}
      {/*<div*/}
      {/*  className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />*/}
      {/*<div*/}
      {/*  className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />*/}

      <motion.div className="absolute left-0 top-0 w-full" animate={controls}>
        <div className="relative flex flex-col">
          {/* Ligne verticale avec gradient */}
          <div className="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-slate-200 via-[oklch(68.5%_0.169_237.323)] to-slate-200 dark:from-slate-700 dark:via-[oklch(68.5%_0.169_237.323)] dark:to-slate-700 opacity-50" />

          {[...experiences, ...experiences].map((exp, index) => (
            <div
              key={index}
              className="relative w-full py-3 pl-12 pr-4 group/item"
            >
              {/* Point animé sur la ligne */}
              <div className="absolute left-[18px] top-1/2 -translate-y-1/2">
                <div className="relative">
                  {/* Cercle extérieur animé */}
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-[oklch(68.5%_0.169_237.323)] opacity-20 group-hover/item:scale-[2.5] transition-transform duration-300" />
                  {/* Point central */}
                  <div className="relative h-3 w-3 rounded-full bg-[oklch(68.5%_0.169_237.323)] border-2 border-white dark:border-slate-900 group-hover/item:scale-110 transition-transform duration-300" />
                </div>
              </div>

              {/* Ligne de connexion au contenu */}
              <div className="absolute left-8 top-1/2 w-4 h-0.5 bg-gradient-to-r from-[oklch(68.5%_0.169_237.323)] to-transparent opacity-0 group-hover/item:opacity-50 transition-opacity duration-300" />

              {/* Contenu de la carte avec hover effect */}
              <div className="text-left rounded-lg p-3 -ml-3 transition-all duration-300 group-hover/item:bg-slate-50 dark:group-hover/item:bg-slate-800/50 group-hover/item:shadow-lg group-hover/item:shadow-[oklch(68.5%_0.169_237.323)]/10">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover/item:text-[oklch(68.5%_0.169_237.323)] transition-colors duration-300">
                  {exp.title}
                </h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {exp.company}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {exp.date}
                </p>
                {/* Description qui apparaît au hover */}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 opacity-0 max-h-0 group-hover/item:opacity-100 group-hover/item:max-h-20 transition-all duration-300 overflow-hidden">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Indicateur de scroll sur desktop */}
      {!isMobile && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <span>Scroll</span>
          </div>
        </div>
      )}
    </div>
  );
}
