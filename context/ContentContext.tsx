'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supplements as defaultSupplements } from '@/lib/mock-data/supplements';
import { recordedWebinars as defaultWebinars } from '@/lib/mock-data/webinars';
import { pdfResources as defaultPdfs } from '@/lib/mock-data/library';
import type {
  Supplement, MindsetTip, GymBagItem, ShoppingItem, NonNegotiable,
  Webinar, VideoClip, PdfResource, PosingVideo, PosingTip,
} from '@/lib/types';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_MINDSET: MindsetTip[] = [
  { id: 'm1', title: 'Establish Routine',   body: "Plan your days and weeks out. Know when you are doing certain things — this way you literally can't miss. Removes stress and improves your organisation and ability to get things done." },
  { id: 'm2', title: 'Goal Setting',         body: 'Both short and long-term goals give you a sense of accomplishment. Phases and goals set on onboarding give you a clear vision — your mindset will be automatically destined to reach it.' },
  { id: 'm3', title: 'Communication',        body: 'Simply talking when you are in a negative state can help enormously. You can find the root cause and start to build on it to ensure you can overcome that state.' },
  { id: 'm4', title: 'Self Belief',          body: 'Never doubt yourself. Failures are not a bad thing — they give us motivation to do better. Poor check-in, missed session — look at it positively. You have the power to do what you set out to do.' },
  { id: 'm5', title: 'Journalling',          body: "Jot your thoughts down or do a weekly reflection. It allows you to reset, know where you went wrong, and what went well. Clear your mind and go into the next week with a fresh head." },
  { id: 'm6', title: 'Stop Comparing',       body: 'Focus on you and only you. Everyone is on different paths and journeys. Focus on yours and you will feel so much better — it really is that simple.' },
  { id: 'm7', title: 'Embrace the Fitness',  body: 'Working hard and implementing the plan will make you feel 10x better. You will feel successful and know you are having productive days. Putting in 50% gets half-arsed results.' },
  { id: 'm8', title: 'The Weekend Warrior',  body: "It is okay to say no. Get the balance between working on your fitness and still having a good social life. You will feel far less guilty — and far better the next day." },
];

const DEFAULT_GYM_BAG: GymBagItem[] = [
  { id: 'g1', name: 'A Lifting Belt',              desc: 'Used for compound movements — squats, RDLs, bent-over rows, deadlifts.',                         linkLabel: 'View on RDX Sports', linkUrl: 'https://rdxsports.co.uk/rdx-leather-4-padded-training-lifting-belt/' },
  { id: 'g2', name: 'Shaker Bottle',               desc: 'For water and supplements — pre, intra or post workout (creatine, whey protein, EAAs).',        linkLabel: 'View on Bulk',       linkUrl: 'https://www.bulk.com/uk/iconic-shaker-bottle.html' },
  { id: 'g3', name: 'Log Book',                    desc: 'Vital for training progression. Record your lifts so you can follow and build on a set plan.',  linkLabel: 'View on Amazon',     linkUrl: 'https://www.amazon.co.uk/Workout-Log-Gym-Grey-Training/dp/B01H3D1GCW/' },
  { id: 'g4', name: 'Wrist Straps / Knee Sleeves', desc: 'Supporting your wrists and knees whilst lifting — allows for more load and injury prevention.', linkLabel: 'View on Bulk',       linkUrl: 'https://www.bulk.com/uk/lifting-straps.html' },
];

const DEFAULT_SHOPPING: ShoppingItem[] = [
  { id: 'sp1',  name: '5% Lean Beef Mince',      category: 'Protein' },
  { id: 'sp2',  name: 'Chicken Breast',           category: 'Protein' },
  { id: 'sp3',  name: 'Tuna',                     category: 'Protein' },
  { id: 'sp4',  name: 'Turkey Mince 5%',          category: 'Protein' },
  { id: 'sp5',  name: 'Eggs',                     category: 'Protein' },
  { id: 'sp6',  name: 'Greek Yoghurt',            category: 'Protein' },
  { id: 'sp7',  name: 'Quinoa',                   category: 'Protein' },
  { id: 'sp8',  name: 'Nuts & Seeds',             category: 'Protein' },
  { id: 'sp9',  name: 'Pork',                     category: 'Protein' },
  { id: 'sp10', name: 'Oats',                     category: 'Protein' },
  { id: 'sp11', name: 'Steak',                    category: 'Protein' },
  { id: 'sc1',  name: 'Potatoes',                 category: 'Carbs' },
  { id: 'sc2',  name: 'Fruits',                   category: 'Carbs' },
  { id: 'sc3',  name: 'Bread',                    category: 'Carbs' },
  { id: 'sc4',  name: 'Rice',                     category: 'Carbs' },
  { id: 'sc5',  name: 'Pasta',                    category: 'Carbs' },
  { id: 'sc6',  name: 'Vegetables',               category: 'Carbs' },
  { id: 'sc7',  name: 'Cereals',                  category: 'Carbs' },
  { id: 'sc8',  name: 'Oats',                     category: 'Carbs' },
  { id: 'sc9',  name: 'Granola',                  category: 'Carbs' },
  { id: 'sc10', name: 'Noodles',                  category: 'Carbs' },
  { id: 'sf1',  name: 'Avocado',                  category: 'Fats' },
  { id: 'sf2',  name: 'Peanut Butter',            category: 'Fats' },
  { id: 'sf3',  name: 'Dark Chocolate',           category: 'Fats' },
  { id: 'sf4',  name: 'Salmon',                   category: 'Fats' },
  { id: 'sf5',  name: 'Yoghurt',                  category: 'Fats' },
  { id: 'sf6',  name: 'Nuts',                     category: 'Fats' },
  { id: 'sf7',  name: 'Cheese',                   category: 'Fats' },
  { id: 'so1',  name: 'Water',                    category: 'Other' },
  { id: 'so2',  name: 'Tupperware',               category: 'Other' },
  { id: 'so3',  name: 'Food Scales',              category: 'Other' },
  { id: 'so4',  name: 'Freezer Bags',             category: 'Other' },
  { id: 'so5',  name: 'Vitamins',                 category: 'Other' },
  { id: 'so6',  name: 'Coffee',                   category: 'Other' },
  { id: 'so7',  name: 'Zero Cal Flavoured Drops', category: 'Other' },
];

const DEFAULT_NON_NEG: NonNegotiable[] = [
  { id: 'n1', label: 'Steps',             desc: 'Meeting your desired step target' },
  { id: 'n2', label: 'Training',          desc: 'Not missing training sessions' },
  { id: 'n3', label: 'Macros & Cals',    desc: 'Within a 5–10% leniency range' },
  { id: 'n4', label: '6+ Hours Sleep',   desc: 'For recovery and performance' },
  { id: 'n5', label: 'Daily Metrics',    desc: 'For daily fluctuations at check-in' },
  { id: 'n6', label: 'Weekly Check-In',  desc: 'Photos, weekly metrics and summary' },
  { id: 'n7', label: '6 Training Clips', desc: 'Sent per week for training feedback' },
  { id: 'n8', label: 'Communication',    desc: 'Struggles, wins and group interaction' },
];

const DEFAULT_POSING_VIDEOS: PosingVideo[] = [
  { id: 'pv1', label: 'Posing Clip 1', youtubeUrl: 'https://www.youtube.com/shorts/NrBibnwAbrI' },
  { id: 'pv2', label: 'Posing Clip 2', youtubeUrl: 'https://www.youtube.com/shorts/kJMK1vV7wRI' },
  { id: 'pv3', label: 'Posing Clip 3', youtubeUrl: 'https://www.youtube.com/shorts/33GezNhiD8I' },
];

const DEFAULT_POSING_TIPS: PosingTip[] = [
  { id: 'pt1', key: 'Vacuum',      body: 'Every morning on an empty stomach. 5 sets of 30-second holds before cardio.' },
  { id: 'pt2', key: 'Mandatories', body: 'Run all 8 mandatory poses daily. Muscle memory takes 4–6 weeks to build.' },
  { id: 'pt3', key: 'Transitions', body: 'The walk between poses matters as much as the pose. Keep it deliberate.' },
  { id: 'pt4', key: 'Mirror work', body: "Film yourself weekly from all angles. What feels right often doesn't look right." },
];

// ─── Context type ─────────────────────────────────────────────────────────────

interface ContentContextValue {
  supplements:   Supplement[];    setSupplements:   (v: Supplement[])   => void;
  mindsetTips:   MindsetTip[];    setMindsetTips:   (v: MindsetTip[])   => void;
  gymBag:        GymBagItem[];    setGymBag:        (v: GymBagItem[])   => void;
  shopping:      ShoppingItem[];  setShopping:      (v: ShoppingItem[]) => void;
  nonNeg:        NonNegotiable[]; setNonNeg:        (v: NonNegotiable[]) => void;
  webinars:      Webinar[];       setWebinars:      (v: Webinar[])      => void;
  trainingVideos:VideoClip[];     setTrainingVideos:(v: VideoClip[])    => void;
  posingVideos:  PosingVideo[];   setPosingVideos:  (v: PosingVideo[])  => void;
  posingTips:    PosingTip[];     setPosingTips:    (v: PosingTip[])    => void;
  pdfResources:  PdfResource[];   setPdfResources:  (v: PdfResource[])  => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [supplements,    setSupplements]    = useState<Supplement[]>(defaultSupplements);
  const [mindsetTips,    setMindsetTips]    = useState<MindsetTip[]>(DEFAULT_MINDSET);
  const [gymBag,         setGymBag]         = useState<GymBagItem[]>(DEFAULT_GYM_BAG);
  const [shopping,       setShopping]       = useState<ShoppingItem[]>(DEFAULT_SHOPPING);
  const [nonNeg,         setNonNeg]         = useState<NonNegotiable[]>(DEFAULT_NON_NEG);
  const [webinars,       setWebinars]       = useState<Webinar[]>(defaultWebinars);
  const [trainingVideos, setTrainingVideos] = useState<VideoClip[]>([]);
  const [posingVideos,   setPosingVideos]   = useState<PosingVideo[]>(DEFAULT_POSING_VIDEOS);
  const [posingTips,     setPosingTips]     = useState<PosingTip[]>(DEFAULT_POSING_TIPS);
  const [pdfResources,   setPdfResources]   = useState<PdfResource[]>(defaultPdfs);
  const [initialized,    setInitialized]    = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ss-content');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.supplements?.length)    setSupplements(d.supplements);
        if (d.mindsetTips?.length)    setMindsetTips(d.mindsetTips);
        if (d.gymBag?.length)         setGymBag(d.gymBag);
        if (d.shopping?.length)       setShopping(d.shopping);
        if (d.nonNeg?.length)         setNonNeg(d.nonNeg);
        if (d.webinars?.length)       setWebinars(d.webinars);
        if (d.trainingVideos)         setTrainingVideos(d.trainingVideos);
        if (d.posingVideos?.length)   setPosingVideos(d.posingVideos);
        if (d.posingTips?.length)     setPosingTips(d.posingTips);
        if (d.pdfResources?.length)   setPdfResources(d.pdfResources);
      }
    } catch {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('ss-content', JSON.stringify({
      supplements, mindsetTips, gymBag, shopping, nonNeg,
      webinars, trainingVideos, posingVideos, posingTips, pdfResources,
    }));
  }, [initialized, supplements, mindsetTips, gymBag, shopping, nonNeg,
      webinars, trainingVideos, posingVideos, posingTips, pdfResources]);

  return (
    <ContentContext.Provider value={{
      supplements, setSupplements,
      mindsetTips, setMindsetTips,
      gymBag, setGymBag,
      shopping, setShopping,
      nonNeg, setNonNeg,
      webinars, setWebinars,
      trainingVideos, setTrainingVideos,
      posingVideos, setPosingVideos,
      posingTips, setPosingTips,
      pdfResources, setPdfResources,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
