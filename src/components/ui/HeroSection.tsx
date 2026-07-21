"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useChat } from "@/hooks/useChat";

const quickFacts = ["LLM systems", "Product-minded", "From Marseille"];

export const HeroSection = () => {
  const { openChat } = useChat();

  return (
    <section className="relative grid min-h-[calc(100svh-8rem)] items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-16" aria-labelledby="hero-title">
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-card/80 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground shadow-sm"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Building at Free Pro · Studying at CPE Lyon
        </motion.div>

        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-display max-w-4xl text-[clamp(3.5rem,9vw,7.7rem)] font-semibold leading-[0.83] tracking-[-0.055em]"
        >
          I make AI
          <span className="relative mx-2 inline-block text-primary sm:mx-3">
            useful
            <svg viewBox="0 0 220 16" className="absolute -bottom-1 left-0 w-full text-accent" aria-hidden="true">
              <motion.path d="M3 10 C55 2, 130 18, 217 6" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.7 }} />
            </svg>
          </span>
          <br />and software feel human.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          I&apos;m Mathis, an AI &amp; software engineering student turning ambitious ideas into reliable products—one thoughtful system at a time.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }} className="mt-8 flex flex-wrap gap-3">
          <Link href="/projects" className="group inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-black text-background shadow-[0_7px_0_color-mix(in_oklab,var(--primary)_45%,transparent)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none">
            Explore my work <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button type="button" onClick={openChat} className="inline-flex items-center gap-2 rounded-2xl border border-foreground/15 bg-card/75 px-5 py-3.5 text-sm font-black transition-colors hover:bg-secondary/70">
            <MessageCircle className="size-4 text-primary" /> Ask my portfolio
          </button>
        </motion.div>

        <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }} className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground" aria-label="Quick facts">
          {quickFacts.map((fact) => <li key={fact} className="flex items-center gap-2 before:size-1.5 before:rounded-full before:bg-accent">{fact}</li>)}
        </motion.ul>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.92, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-lg lg:max-w-none">
        <div className="absolute -left-5 top-10 hidden rounded-2xl border border-foreground/10 bg-[#f6bd60] px-4 py-3 text-sm font-black text-[#263238] shadow-lg sm:block -rotate-6">
          <Sparkles className="mb-1 size-4" /> Curiosity first
        </div>
        <div className="relative ml-auto aspect-[4/4.7] w-[88%] overflow-hidden rounded-[2.5rem] border-2 border-foreground/10 bg-[#79a7d3] p-3 shadow-[0_30px_80px_color-mix(in_oklab,var(--foreground)_18%,transparent)] sm:w-[82%]">
          <Image
            src="/images/mathis.jpg"
            alt="Mathis Lambert"
            fill
            priority
            sizes="(max-width: 1024px) 80vw, 34vw"
            className="rounded-[2.7rem] object-cover object-[62%_center] p-3"
          />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/30 bg-[#fffaf1]/90 p-4 text-[#263238] shadow-xl backdrop-blur-md">
            <p className="font-display text-2xl font-semibold">Engineer in motion</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#4d646b]"><MapPin className="size-3.5 text-[#e76f51]" /> Marseille, France</p>
          </div>
        </div>
        <motion.div animate={{ y: [0, -8, 0], rotate: [8, 11, 8] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -right-2 top-8 grid size-24 place-items-center rounded-[2rem] border border-foreground/10 bg-[#f28482] shadow-lg sm:-right-4 sm:size-28">
          <Image src="/images/sticker-10.png" alt="" width={90} height={90} className="size-20 object-contain sm:size-24" />
        </motion.div>
        <div className="absolute -bottom-5 left-0 rounded-full border border-foreground/10 bg-card px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-lg rotate-3">learn · build · share</div>
      </motion.div>

      <a href="#now" className="absolute bottom-1 left-0 hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground lg:flex">
        Keep scrolling <ArrowDown className="size-4 animate-bounce" />
      </a>
    </section>
  );
};
