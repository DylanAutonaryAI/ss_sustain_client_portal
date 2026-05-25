import type { PdfResource, Recommendation } from '@/lib/types';

export const pdfResources: PdfResource[] = [
  { id: '1',  title: 'SS Sustain Welcome Guide',         meta: 'PDF · Getting started',         url: '/pdfs/welcome-guide.pdf' },
  { id: '2',  title: 'Check-In Process',                 meta: 'PDF · How check-ins work',       url: '/pdfs/check-in-process.pdf' },
  { id: '3',  title: 'Nutritional Pack',                 meta: 'PDF · Nutrition foundations',    url: '/pdfs/NUTRITIONAL PACK.pdf' },
  { id: '4',  title: 'Eat Well & Get Results',           meta: 'PDF · Nutrition guide',          url: '/pdfs/EAT WELL & GET RESULTS.pdf' },
  { id: '5',  title: 'Meal Recipes Vol. 1',              meta: 'PDF · Recipe collection',        url: '/pdfs/MEAL RECIPES 01.pdf' },
  { id: '6',  title: 'Meal Recipes Vol. 2',              meta: 'PDF · Recipe collection',        url: '/pdfs/MEAL RECIPES 02.pdf' },
  { id: '7',  title: 'Calorie Banking',                  meta: 'PDF · Flexible dieting strategy', url: '/pdfs/CALORIE BANKING.pdf' },
  { id: '8',  title: '8 Money Saving Tips',              meta: 'PDF · Budget eating guide',      url: '/pdfs/8 MONEY SAVING TIPS.pdf' },
  { id: '9',  title: 'How to Master Social Events',      meta: 'PDF · Staying on track socially', url: '/pdfs/How to master social events.pdf' },
  { id: '10', title: 'Stay Strong During Xmas',          meta: 'PDF · Holiday survival guide',   url: '/pdfs/STAY STRONG DURING XMAS.pdf' },
  { id: '11', title: 'Training Overview',                meta: 'PDF · Training foundations',     url: '/pdfs/TRAINING OVERVIEW.pdf' },
  { id: '12', title: 'Training Development Guide',       meta: 'PDF · Progressive training plan', url: '/pdfs/TRAINING DEVELOPMENT GUIDE.pdf' },
  { id: '13', title: 'Home Fitness Programme',           meta: 'PDF · Train anywhere',           url: '/pdfs/HOME FITNESS PROGRAMME.pdf' },
  { id: '14', title: 'Sleep & Pre-Bed Routine',          meta: 'PDF · Recovery protocol',        url: '/pdfs/SLEEP & PRE BED ROUTINE.pdf' },
];

export const recommendations: Recommendation[] = [
  { id: '1', icon: '🎒', title: 'Gym Bag Essentials',    subtitle: 'What to bring to every session' },
  { id: '2', icon: '🛒', title: 'Weekly Shopping List',  subtitle: 'Makes hitting macros effortless' },
  { id: '3', icon: '✅', title: 'Daily Non-Negotiables', subtitle: 'The habits that separate consistent athletes' },
];
