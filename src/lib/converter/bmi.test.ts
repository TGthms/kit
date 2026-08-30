import { describe, expect, it } from "vitest";
import {
  ACTIVITY_FACTORS,
  CALORIE_FLOOR,
  bmiCategory,
  calculateBodyStats,
  cmToMeters,
  healthyWeightKg,
  imperialHeightToMeters,
  kgToLb,
  lbToKg,
  metersToImperialHeight,
  mifflinStJeorBmr,
  roundTo,
  totalDailyEnergy,
} from "./bmi";

describe("body measurements", () => {
  it("converts metric and imperial height and weight", () => {
    expect(cmToMeters(175)).toBe(1.75);
    expect(imperialHeightToMeters(5, 10)).toBeCloseTo(1.778, 4);
    expect(imperialHeightToMeters(0, 70)).toBeCloseTo(1.778, 4);
    expect(lbToKg(154)).toBeCloseTo(69.853, 3);
    expect(kgToLb(70)).toBeCloseTo(154.324, 3);
    expect(metersToImperialHeight(1.778)).toEqual({ feet: 5, inches: 10 });
  });

  it("rejects impossible measurements", () => {
    expect(() => imperialHeightToMeters(-1, 0)).toThrow(RangeError);
    expect(() => lbToKg(Number.NaN)).toThrow(RangeError);
    expect(() => calculateBodyStats({ heightM: 1.7, weightKg: 8, ageYears: 30, sex: "female", activity: "moderate" })).toThrow(RangeError);
    expect(() => calculateBodyStats({ heightM: 1.7, weightKg: 70, ageYears: 1, sex: "female", activity: "moderate" })).toThrow(RangeError);
  });
});

describe("BMI", () => {
  it("uses WHO adult cutoffs on a one-decimal BMI", () => {
    expect(roundTo(70 / (1.75 * 1.75), 1)).toBe(22.9);
    expect(bmiCategory(18.4)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(24.9)).toBe("normal");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese1");
    expect(bmiCategory(35)).toBe("obese2");
    expect(bmiCategory(40)).toBe("obese3");
  });

  it("reports the WHO healthy weight band for a height", () => {
    expect(healthyWeightKg(1.75)).toEqual({ min: 56.7, max: 76.3 });
  });
});

describe("Mifflin-St Jeor calories", () => {
  it("matches the published male and female equations", () => {
    expect(mifflinStJeorBmr(80, 180, 30, "male")).toBe(1780);
    expect(mifflinStJeorBmr(80, 180, 30, "female")).toBe(1614);
    expect(totalDailyEnergy(1780, "sedentary")).toBe(Math.round(1780 * ACTIVITY_FACTORS.sedentary));
    expect(totalDailyEnergy(1780, "moderate")).toBe(Math.round(1780 * 1.55));
  });

  it("builds BMI, healthy weight, and calorie targets together", () => {
    const result = calculateBodyStats({
      heightM: 1.8,
      weightKg: 80,
      ageYears: 30,
      sex: "male",
      activity: "sedentary",
    });
    expect(result.bmi).toBe(24.7);
    expect(result.category).toBe("normal");
    expect(result.minor).toBe(false);
    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2136);
    expect(result.calories).toEqual({
      lose: 1636,
      maintain: 2136,
      gain: 2636,
      loseFloored: false,
    });
  });

  it("floors an aggressive deficit at 1200 kcal without exceeding TDEE", () => {
    const low = calculateBodyStats({
      heightM: 1.55,
      weightKg: 50,
      ageYears: 60,
      sex: "female",
      activity: "sedentary",
    });
    expect(low.tdee).toBeLessThan(CALORIE_FLOOR + 500);
    expect(low.calories.lose).toBeGreaterThanOrEqual(CALORIE_FLOOR);
    expect(low.calories.lose).toBeLessThanOrEqual(low.tdee);
    expect(low.calories.loseFloored).toBe(low.calories.lose === CALORIE_FLOOR && low.tdee > CALORIE_FLOOR);

    const alreadyLow = calculateBodyStats({
      heightM: 1.5,
      weightKg: 45,
      ageYears: 80,
      sex: "female",
      activity: "sedentary",
    });
    expect(alreadyLow.tdee).toBeLessThan(CALORIE_FLOOR);
    expect(alreadyLow.calories.lose).toBe(alreadyLow.tdee);
    expect(alreadyLow.calories.loseFloored).toBe(false);
  });

  it("computes a marked result for ages under 18", () => {
    const child = calculateBodyStats({
      heightM: 1.4,
      weightKg: 35,
      ageYears: 12,
      sex: "female",
      activity: "moderate",
    });
    expect(child.minor).toBe(true);
    expect(child.bmi).toBe(17.9);
    expect(child.category).toBe("underweight");
    expect(child.bmr).toBeGreaterThan(0);
    expect(calculateBodyStats({
      heightM: 1.8,
      weightKg: 80,
      ageYears: 18,
      sex: "male",
      activity: "sedentary",
    }).minor).toBe(false);
  });
});
