export type Sex = "female" | "male";
export type UnitSystem = "metric" | "imperial";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese1" | "obese2" | "obese3";

export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "veryActive"] as const;

/** Standard TDEE multipliers applied to Mifflin-St Jeor BMR. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;
export const WHO_BMI_MIN = 18.5;
export const WHO_BMI_MAX = 24.9;
export const CALORIE_FLOOR = 1200;
export const WEEKLY_KCAL = 500;

const AGE_MIN = 18;
const AGE_MAX = 120;
const HEIGHT_M_MIN = 0.5;
const HEIGHT_M_MAX = 2.5;
const WEIGHT_KG_MIN = 20;
const WEIGHT_KG_MAX = 400;

export type BodyStatsInput = {
  heightM: number;
  weightKg: number;
  ageYears: number;
  sex: Sex;
  activity: ActivityLevel;
};

export type BodyStats = {
  bmi: number;
  category: BmiCategory;
  healthyWeightKg: { min: number; max: number };
  bmr: number;
  tdee: number;
  calories: {
    lose: number;
    maintain: number;
    gain: number;
    loseFloored: boolean;
  };
};

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
}

function assertInRange(value: number, min: number, max: number, name: string): void {
  assertFinite(value, name);
  if (value < min || value > max) throw new RangeError(`${name} must be between ${min} and ${max}.`);
}

export function roundTo(value: number, decimals: number): number {
  assertFinite(value, "value");
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) throw new RangeError("decimals must be an integer from 0 to 8.");
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function cmToMeters(cm: number): number {
  assertFinite(cm, "cm");
  return cm / 100;
}

export function imperialHeightToMeters(feet: number, inches: number): number {
  assertFinite(feet, "feet");
  assertFinite(inches, "inches");
  if (feet < 0 || inches < 0) throw new RangeError("height must be non-negative.");
  return (feet * 12 + inches) * (CM_PER_INCH / 100);
}

export function metersToCm(meters: number): number {
  return meters * 100;
}

export function metersToImperialHeight(meters: number): { feet: number; inches: number } {
  const totalInches = meters / (CM_PER_INCH / 100);
  const feet = Math.floor(totalInches / 12);
  const inches = roundTo(totalInches - feet * 12, 1);
  if (inches >= 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

export function lbToKg(lb: number): number {
  assertFinite(lb, "lb");
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number): number {
  assertFinite(kg, "kg");
  return kg / KG_PER_LB;
}

export function bmiCategory(bmi: number): BmiCategory {
  assertFinite(bmi, "bmi");
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obese1";
  if (bmi < 40) return "obese2";
  return "obese3";
}

export function healthyWeightKg(heightM: number): { min: number; max: number } {
  assertInRange(heightM, HEIGHT_M_MIN, HEIGHT_M_MAX, "height");
  const squared = heightM * heightM;
  return {
    min: roundTo(WHO_BMI_MIN * squared, 1),
    max: roundTo(WHO_BMI_MAX * squared, 1),
  };
}

/** Mifflin-St Jeor resting energy, rounded to the nearest calorie. */
export function mifflinStJeorBmr(weightKg: number, heightCm: number, ageYears: number, sex: Sex): number {
  assertInRange(weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX, "weight");
  assertInRange(cmToMeters(heightCm), HEIGHT_M_MIN, HEIGHT_M_MAX, "height");
  assertInRange(ageYears, AGE_MIN, AGE_MAX, "age");
  if (sex !== "female" && sex !== "male") throw new RangeError("sex must be female or male.");
  const sexOffset = sex === "male" ? 5 : -161;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexOffset);
}

export function totalDailyEnergy(bmr: number, activity: ActivityLevel): number {
  const factor = ACTIVITY_FACTORS[activity];
  if (!factor) throw new RangeError("activity must be a known level.");
  assertFinite(bmr, "bmr");
  if (bmr <= 0) throw new RangeError("bmr must be positive.");
  return Math.round(bmr * factor);
}

export function calculateBodyStats(input: BodyStatsInput): BodyStats {
  const { heightM, weightKg, ageYears, sex, activity } = input;
  assertInRange(heightM, HEIGHT_M_MIN, HEIGHT_M_MAX, "height");
  assertInRange(weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX, "weight");
  assertInRange(ageYears, AGE_MIN, AGE_MAX, "age");
  if (sex !== "female" && sex !== "male") throw new RangeError("sex must be female or male.");
  if (!(activity in ACTIVITY_FACTORS)) throw new RangeError("activity must be a known level.");

  const bmi = roundTo(weightKg / (heightM * heightM), 1);
  const bmr = mifflinStJeorBmr(weightKg, metersToCm(heightM), ageYears, sex);
  const tdee = totalDailyEnergy(bmr, activity);
  const rawLose = tdee - WEEKLY_KCAL;
  const lose = Math.min(tdee, Math.max(CALORIE_FLOOR, rawLose));

  return {
    bmi,
    category: bmiCategory(bmi),
    healthyWeightKg: healthyWeightKg(heightM),
    bmr,
    tdee,
    calories: {
      lose,
      maintain: tdee,
      gain: tdee + WEEKLY_KCAL,
      loseFloored: lose === CALORIE_FLOOR && tdee > CALORIE_FLOOR && rawLose < CALORIE_FLOOR,
    },
  };
}
