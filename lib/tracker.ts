// Off-plan meal / night-out tracker — data + types + weekly maths.
// Ported from Sam's standalone app; the calorie data is his. Plain module (no
// 'use client') so the client page and any server code can both import it.

export type TrackerGoal = 'Fat loss' | 'Maintenance';

export interface TrackerProfile {
  calories: number;        // daily calorie target
  goal: TrackerGoal;
  steps: number | null;    // avg daily steps
  sessions: number | null; // weekly training sessions
}

export interface TrackerLog {
  id: number;
  label: string;
  cal: number;
  notes: string | null;
  isNightOut: boolean;
  loggedOn: string;        // YYYY-MM-DD
}

export interface Drink { emoji: string; name: string; ml: number; abv: number; cal: number }

// ─── drinks (with units = ml * abv / 1000) ───────────────────────────────────
export const DRINKS: Drink[] = [
  { emoji: '🍺', name: 'Pint of lager',         ml: 568, abv: 4.5, cal: 215 },
  { emoji: '🍺', name: 'Pint of Guinness',      ml: 568, abv: 4.2, cal: 210 },
  { emoji: '🍻', name: 'Bottle of beer (330ml)', ml: 330, abv: 5.0, cal: 142 },
  { emoji: '🍷', name: 'Glass of wine (175ml)',  ml: 175, abv: 12,  cal: 160 },
  { emoji: '🥂', name: 'Prosecco (125ml)',       ml: 125, abv: 11,  cal: 80  },
  { emoji: '🥃', name: 'Single spirit (25ml)',   ml: 25,  abv: 40,  cal: 56  },
  { emoji: '🥃', name: 'Double spirit (50ml)',   ml: 50,  abv: 40,  cal: 112 },
  { emoji: '🍹', name: 'Cocktail (avg)',          ml: 200, abv: 12,  cal: 240 },
  { emoji: '🍸', name: 'Gin & tonic',             ml: 250, abv: 10,  cal: 170 },
  { emoji: '🥤', name: 'Vodka Red Bull',          ml: 330, abv: 8,   cal: 230 },
  { emoji: '🍾', name: 'Bottle of wine',          ml: 750, abv: 12,  cal: 680 },
  { emoji: '🎉', name: 'Sambuca shot',            ml: 25,  abv: 38,  cal: 80  },
];

export const drinkUnits = (d: Drink) => (d.ml * d.abv) / 1000;

export const LATE_NIGHT_FOOD = [
  { label: '🌯 Kebab', cal: 800 },
  { label: '🍕 Pizza slice', cal: 280 },
  { label: '🍟 Chips', cal: 400 },
  { label: '🥙 Burger', cal: 600 },
  { label: 'None', cal: 0 },
];

export interface MealPreset { label: string; cal: number | null }
export const MEAL_PRESETS: MealPreset[] = [
  { label: '🍕 Pizza (3 large slices)', cal: 850 },
  { label: '🍔 Burger & fries',         cal: 950 },
  { label: '🍛 Indian takeaway',        cal: 1100 },
  { label: '🍜 Chinese takeaway',       cal: 900 },
  { label: '🌯 Large doner kebab',      cal: 800 },
  { label: '🍣 Sushi (12 pieces)',      cal: 500 },
  { label: '🥗 Restaurant main',        cal: 700 },
  { label: '🎂 Celebration meal',       cal: 1200 },
  { label: '✏️ Enter manually',         cal: null },
];

export interface FastFoodBrand { id: string; name: string; emoji: string; items: { name: string; cal: number }[] }
export const FAST_FOOD_BRANDS: FastFoodBrand[] = [
  { id: 'mcdonalds', name: "McDonald's", emoji: '🍟', items: [
    { name: 'Big Mac', cal: 508 }, { name: 'Quarter Pounder w/ Cheese', cal: 520 },
    { name: 'McChicken Sandwich', cal: 388 }, { name: 'Double Cheeseburger', cal: 445 },
    { name: 'McNuggets x6', cal: 259 }, { name: 'McNuggets x9', cal: 388 }, { name: 'McNuggets x20', cal: 859 },
    { name: 'Large Fries', cal: 444 }, { name: 'Medium Fries', cal: 337 }, { name: 'Filet-O-Fish', cal: 329 },
    { name: 'McPlant Burger', cal: 426 }, { name: 'Sausage & Egg McMuffin', cal: 430 }, { name: 'Hash Brown', cal: 150 },
    { name: 'Big Mac Meal (large)', cal: 1080 }, { name: 'McFlurry', cal: 354 }, { name: 'Apple Pie', cal: 253 },
  ] },
  { id: 'kfc', name: 'KFC', emoji: '🍗', items: [
    { name: 'Original Fillet Burger', cal: 485 }, { name: 'Zinger Burger', cal: 450 }, { name: 'Tower Burger', cal: 614 },
    { name: 'Ricebox', cal: 520 }, { name: '3pc Chicken (original)', cal: 555 }, { name: '3pc Chicken (fillet)', cal: 498 },
    { name: 'Popcorn Chicken (regular)', cal: 286 }, { name: 'Popcorn Chicken (large)', cal: 445 },
    { name: 'Regular Fries', cal: 260 }, { name: 'Large Fries', cal: 380 }, { name: 'Coleslaw', cal: 170 },
    { name: 'Gravy', cal: 65 }, { name: 'Corn on the Cob', cal: 135 }, { name: 'Zinger Box Meal', cal: 1050 },
    { name: 'Boneless Banquet (large)', cal: 1240 },
  ] },
  { id: 'burger-king', name: 'Burger King', emoji: '👑', items: [
    { name: 'Whopper', cal: 630 }, { name: 'Whopper w/ Cheese', cal: 700 }, { name: 'Double Whopper', cal: 900 },
    { name: 'Chicken Royale', cal: 584 }, { name: 'Crispy Chicken Sandwich', cal: 540 }, { name: 'Plant-Based Whopper', cal: 628 },
    { name: 'Regular Fries', cal: 243 }, { name: 'Large Fries', cal: 383 }, { name: 'Onion Rings (regular)', cal: 320 },
    { name: 'Chicken Nuggets x6', cal: 270 }, { name: 'Whopper Meal (large)', cal: 1150 },
  ] },
  { id: 'subway', name: 'Subway', emoji: '🥖', items: [
    { name: '6" Chicken Teriyaki', cal: 310 }, { name: '6" Tuna', cal: 380 }, { name: '6" Meatball Marinara', cal: 480 },
    { name: '6" Steak & Cheese', cal: 380 }, { name: '6" BLT', cal: 320 }, { name: '6" Veggie Delite', cal: 200 },
    { name: 'Footlong Chicken Teriyaki', cal: 620 }, { name: 'Footlong Meatball', cal: 960 }, { name: 'Footlong Tuna', cal: 760 },
    { name: 'Cookies x1', cal: 210 }, { name: 'Hash Browns', cal: 150 },
  ] },
  { id: 'dominos', name: "Domino's", emoji: '🍕', items: [
    { name: 'Pepperoni Pizza (med, 2sl)', cal: 480 }, { name: 'Pepperoni Pizza (lrg, 2sl)', cal: 560 },
    { name: 'Margherita (med, 2 slices)', cal: 400 }, { name: 'Chicken Feast (lrg, 2sl)', cal: 520 },
    { name: 'Mighty Meaty (lrg, 2sl)', cal: 590 }, { name: 'Vegi Supreme (lrg, 2sl)', cal: 440 },
    { name: 'Garlic Bread', cal: 310 }, { name: 'Cheesy Garlic Bread', cal: 400 }, { name: 'Chicken Strippers x4', cal: 290 },
    { name: 'Potato Wedges', cal: 380 }, { name: "Ben & Jerry's (tub)", cal: 490 },
    { name: 'Whole Medium Pizza', cal: 1200 }, { name: 'Whole Large Pizza', cal: 1600 },
  ] },
  { id: 'pizza-hut', name: 'Pizza Hut', emoji: '🍕', items: [
    { name: 'Pepperoni (med, 2 slices)', cal: 500 }, { name: 'BBQ Chicken (med, 2sl)', cal: 480 },
    { name: 'Margherita (med, 2 slices)', cal: 390 }, { name: 'Meat Feast (med, 2 slices)', cal: 560 },
    { name: 'Stuffed Crust (2 slices)', cal: 610 }, { name: 'Thin & Crispy (2 slices)', cal: 380 },
    { name: 'Garlic Bread', cal: 290 }, { name: 'Chicken Wings x5', cal: 350 }, { name: 'Potato Wedges', cal: 360 },
    { name: 'Whole Medium Pizza (est)', cal: 1300 },
  ] },
  { id: 'nandos', name: "Nando's", emoji: '🔥', items: [
    { name: '1/4 Chicken (breast)', cal: 290 }, { name: '1/4 Chicken (thigh & leg)', cal: 355 },
    { name: '1/2 Chicken', cal: 645 }, { name: 'Whole Chicken', cal: 1290 }, { name: 'Chicken Thighs x3', cal: 510 },
    { name: 'Chicken Burger', cal: 510 }, { name: 'Fino Pitta', cal: 440 }, { name: 'Chicken Wrap', cal: 490 },
    { name: 'Peri-Peri Chips (regular)', cal: 340 }, { name: 'Peri-Peri Chips (large)', cal: 490 },
    { name: 'Macho Peas', cal: 195 }, { name: 'Corn on the Cob', cal: 200 }, { name: 'Coleslaw', cal: 195 },
    { name: 'Garlic Bread', cal: 295 }, { name: 'Bottomless Frozen Yoghurt', cal: 150 },
  ] },
  { id: 'greggs', name: 'Greggs', emoji: '🥐', items: [
    { name: 'Sausage Roll', cal: 311 }, { name: 'Vegan Sausage Roll', cal: 277 }, { name: 'Steak Bake', cal: 408 },
    { name: 'Cheese & Onion Pasty', cal: 422 }, { name: 'Sausage, Egg & Cheese Bap', cal: 442 },
    { name: 'Bacon & Cheese Wrap', cal: 380 }, { name: 'Ham & Cheese Baguette', cal: 430 },
    { name: 'Chicken Club Baguette', cal: 480 }, { name: 'Chicken Caesar Wrap', cal: 410 },
    { name: 'Doughnut (glazed)', cal: 330 }, { name: 'Yum Yum', cal: 340 }, { name: 'Caramel Latte (med)', cal: 185 },
  ] },
  { id: 'five-guys', name: 'Five Guys', emoji: '🍔', items: [
    { name: 'Hamburger', cal: 590 }, { name: 'Cheeseburger', cal: 660 }, { name: 'Bacon Burger', cal: 650 },
    { name: 'Bacon Cheeseburger', cal: 720 }, { name: 'Little Hamburger', cal: 420 }, { name: 'Little Cheeseburger', cal: 490 },
    { name: 'Veggie Sandwich', cal: 440 }, { name: 'Hot Dog', cal: 550 }, { name: 'Regular Fries', cal: 530 },
    { name: 'Large Fries', cal: 953 }, { name: 'Bacon Cheeseburger + Fries', cal: 1483 },
  ] },
  { id: 'leon', name: 'Leon', emoji: '🌿', items: [
    { name: 'Chicken Caesar Wrap', cal: 430 }, { name: 'Falafel Mezze Wrap', cal: 395 }, { name: 'Pulled Chicken Box', cal: 480 },
    { name: 'Halloumi Fries', cal: 410 }, { name: 'Sweet Potato Fries', cal: 310 }, { name: 'Superfood Salad', cal: 285 },
    { name: 'Chicken Nuggets x5', cal: 270 }, { name: 'Rice Box', cal: 520 },
  ] },
  { id: 'pizza-express', name: 'PizzaExpress', emoji: '🍕', items: [
    { name: 'Margherita (Classic)', cal: 898 }, { name: 'American (Classic)', cal: 1016 }, { name: 'La Reine (Classic)', cal: 963 },
    { name: 'Vegan Giardiniera', cal: 820 }, { name: 'Dough Balls x6', cal: 491 }, { name: 'Bruschetta', cal: 380 },
    { name: 'Calamari', cal: 490 },
  ] },
  { id: 'wagamama', name: 'Wagamama', emoji: '🍜', items: [
    { name: 'Chicken Katsu Curry', cal: 832 }, { name: 'Beef Ramen', cal: 693 }, { name: 'Chicken Ramen', cal: 575 },
    { name: 'Yaki Soba (chicken)', cal: 648 }, { name: 'Pad Thai (chicken)', cal: 720 }, { name: 'Gyoza x6 (chicken)', cal: 350 },
    { name: 'Edamame', cal: 120 }, { name: 'Bang Bang Cauliflower', cal: 420 },
  ] },
];

// ─── recovery suggestions (when over the daily target) ───────────────────────
export interface RecoveryOption { icon: string; tag: string; tone: 'green' | 'gold' | 'muted'; title: string; desc: string; tip: string }
export function recoveryOptions(over: number): RecoveryOption[] {
  const steps = (kcal: number) => Math.round(kcal / 0.04).toLocaleString();
  return [
    { icon: '📉', tag: 'Easiest', tone: 'green', title: 'Gentle reduction',
      desc: `Cut ${Math.round(over / 6)} kcal/day for 6 days`,
      tip: 'Swap one snack or reduce portion sizes slightly across the rest of the week.' },
    { icon: '🚶', tag: 'Active', tone: 'gold', title: 'Extra steps',
      desc: `Add ~${steps(over / 6)} steps/day`,
      tip: 'A 20–30 min brisk walk burns ~80–120 kcal. Stack it onto your commute or lunch break.' },
    { icon: '🔁', tag: 'Recommended', tone: 'green', title: 'Hybrid approach',
      desc: `Cut ${Math.round(over / 12)} kcal/day + add ${steps(over / 12)} steps`,
      tip: 'Small tweaks on both sides — the easiest strategy to maintain long term.' },
    { icon: '😌', tag: 'No stress', tone: 'muted', title: 'Do nothing extra',
      desc: 'Resume normal eating tomorrow',
      tip: "One night out won't undo weeks of work. The lads who get results are the ones who keep showing up — not the ones who were perfect." },
  ];
}

// ─── weekly stats (Monday-start week), faithful to Sam's dashboard maths ──────
export function weekStartISO(d = new Date()): string {
  const day = d.getDay();                 // 0=Sun..6=Sat
  const diff = day === 0 ? 6 : day - 1;   // days since Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export interface WeekStats {
  budget: number; consumed: number; remaining: number; pct: number;
  daysIn: number; expected: number; vs: number;
  status: 'under' | 'on' | 'over';
}
export function weekStats(profile: TrackerProfile, weekLogs: TrackerLog[]): WeekStats {
  const budget = profile.calories * 7;
  const consumed = weekLogs.reduce((s, l) => s + l.cal, 0);
  const remaining = budget - consumed;
  const pct = budget > 0 ? Math.min((consumed / budget) * 100, 100) : 0;
  const dow = new Date().getDay();
  const daysIn = dow === 0 ? 7 : dow;
  const expected = profile.calories * daysIn;
  const vs = consumed - expected;
  const status = vs < -200 ? 'under' : vs > 500 ? 'over' : 'on';
  return { budget, consumed, remaining, pct, daysIn, expected, vs, status };
}
