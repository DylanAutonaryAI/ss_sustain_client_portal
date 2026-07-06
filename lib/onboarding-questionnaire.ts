// Client intake questionnaire — the content of Sam's "INFORMATION SHEET &
// QUESTIONNAIRE", rebuilt as a structured form for the onboarding flow.
// Answers are stored per client (onboarding_questionnaire.answers jsonb, keyed by
// field id) and shown to Sam on the roster. Name / email / phone are NOT re-asked
// here — the portal already has them from the account + roster row.
//
// 1–5 scales follow Sam's sheet: 1 = Worst, 5 = Best.
//
// ⚠️ Field `id`s are stable keys stored in the answers JSON — don't rename an id
//    once real clients have submitted; add/remove fields instead.

export type QFieldType = 'text' | 'textarea' | 'number' | 'scale' | 'select' | 'yesno';

export interface QField {
  id: string;
  label: string;
  type: QFieldType;
  options?: string[];     // for 'select'
  placeholder?: string;
  suffix?: string;        // e.g. "kg", "L", "hrs"
}

export interface QSection {
  title: string;
  intro?: string;
  fields: QField[];
}

export const QUESTIONNAIRE: QSection[] = [
  {
    title: 'Personal',
    fields: [
      { id: 'age', label: 'Age', type: 'number' },
      { id: 'weight_kg', label: 'Current weight', type: 'number', suffix: 'kg' },
      { id: 'height', label: 'Height', type: 'text', placeholder: "e.g. 5'11\" or 180cm" },
      { id: 'bodyfat', label: 'Current body fat (if known)', type: 'text', placeholder: 'e.g. 18% — optional' },
      { id: 'contact_number', label: 'Best contact number', type: 'text', placeholder: 'Mobile number' },
    ],
  },
  {
    title: 'Energy expenditure & training',
    fields: [
      { id: 'occupation', label: 'Occupation', type: 'text' },
      { id: 'job_activity', label: 'How active is your job?', type: 'scale' },
      { id: 'train_hours_week', label: 'Hours a week you currently train', type: 'text', placeholder: 'e.g. 5' },
      { id: 'current_gym', label: 'What gym are you at currently?', type: 'text' },
      { id: 'other_exercise', label: 'Other exercise you do outside the gym', type: 'textarea', placeholder: 'e.g. walking, football, classes…' },
      { id: 'tried_past', label: "What have you tried in the past?", type: 'textarea' },
      { id: 'train_days_week', label: 'How many days a week can you train?', type: 'number' },
    ],
  },
  {
    title: 'Goals',
    fields: [
      { id: 'main_goal', label: 'The main goal you want from this coaching programme', type: 'textarea' },
      { id: 'desired_shape', label: 'What sort of shape would you like to be in?', type: 'textarea' },
      { id: 'gym_experience', label: 'How much gym experience do you have?', type: 'text' },
      { id: 'held_back', label: "What's held you back from your goals so far?", type: 'textarea' },
    ],
  },
  {
    title: 'Health',
    fields: [
      { id: 'injuries', label: 'Any previous or current injuries / surgeries I should know about?', type: 'textarea', placeholder: 'None, or list them' },
      { id: 'medication', label: 'Do you take any medication?', type: 'text', placeholder: 'None, or list them' },
    ],
  },
  {
    title: 'Sleep',
    fields: [
      { id: 'sleep_hours', label: 'Hours of sleep per night', type: 'number', suffix: 'hrs' },
      { id: 'sleep_quality', label: 'How well do you sleep?', type: 'scale' },
    ],
  },
  {
    title: 'Alcohol & caffeine',
    fields: [
      { id: 'alcohol_weekly', label: "What's your weekly alcohol consumption like?", type: 'text' },
      { id: 'caffeine_daily', label: "What's your daily caffeine intake like?", type: 'text' },
      { id: 'more_weekend', label: 'Do you tend to drink more alcohol at the weekend?', type: 'yesno' },
    ],
  },
  {
    title: 'Nutrition',
    fields: [
      { id: 'ok_assessment_week', label: "Happy for me to take an assessment week / food diary for your first week?", type: 'yesno' },
      { id: 'understand_macros', label: 'Do you have a good understanding of macronutrients?', type: 'yesno' },
      { id: 'diet_style', label: 'Do you prefer flexible dieting or stricter?', type: 'select', options: ['Flexible', 'Strict', 'Not sure yet'] },
      { id: 'can_weigh_food', label: 'Do you know how to weigh foods using scales?', type: 'yesno' },
      { id: 'past_diets', label: 'What diets have you tried before, and how did you get on?', type: 'textarea' },
      { id: 'dietary_requirements', label: 'Any dietary requirements?', type: 'text', placeholder: 'None, or list them' },
      { id: 'can_meal_prep', label: 'Can you commit to meal prepping and make time for it?', type: 'yesno' },
    ],
  },
  {
    title: 'Hydration',
    fields: [
      { id: 'water_litres', label: 'How much water do you drink per day?', type: 'number', suffix: 'L' },
    ],
  },
  {
    title: 'Supplements',
    fields: [
      { id: 'ok_supplements', label: 'Are you happy for me to suggest a few supplements that could help in the process?', type: 'yesno' },
    ],
  },
];

// Flat list of all fields, for validation + rendering the coach's read-only view.
export const QUESTIONNAIRE_FIELDS: QField[] = QUESTIONNAIRE.flatMap((s) => s.fields);
export const QUESTIONNAIRE_FIELD_IDS = QUESTIONNAIRE_FIELDS.map((f) => f.id);

// A human label lookup for the coach view.
export const QUESTIONNAIRE_LABELS: Record<string, string> = Object.fromEntries(
  QUESTIONNAIRE_FIELDS.map((f) => [f.id, f.label]),
);
