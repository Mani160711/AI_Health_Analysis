import { GoogleGenAI } from "@google/genai";

export type SymptomData = {
  fever: number;
  cough: number;
  fatigue: number;
  headache: number;
  nausea: number;
  chest_pain: number;
  shortness_of_breath: number;
  body_ache: number;
};

interface DiseaseTemplate {
  name: string;
  symptoms: Partial<SymptomData>;
  baseProbability: number;
  recommendations: string[];
}

const diseases: DiseaseTemplate[] = [
  {
    name: "Flu (Influenza)",
    symptoms: { fever: 1, cough: 1, fatigue: 1, body_ache: 1, headache: 1 },
    baseProbability: 35,
    recommendations: [
      "Rest, maintain standard hydration levels",
      "Use fever-reducing medication if advised",
      "Avoid core physical stressors"
    ]
  },
  {
    name: "COVID-19",
    symptoms: { fever: 1, cough: 1, fatigue: 1, shortness_of_breath: 1, headache: 1 },
    baseProbability: 40,
    recommendations: [
      "Self-isolate in a well-ventilated room",
      "Track oxygen saturation levels",
      "Consult a general physician if breathing restricts"
    ]
  },
  {
    name: "Pneumonia",
    symptoms: { cough: 1, fever: 1, shortness_of_breath: 1, chest_pain: 1, fatigue: 1 },
    baseProbability: 25,
    recommendations: [
      "Urgent clinical validation typically required",
      "Sputum cultures or chest radiograph recommended",
      "Antibiotic or supportive therapies"
    ]
  },
  {
    name: "Malaria",
    symptoms: { fever: 1, body_ache: 1, fatigue: 1, nausea: 1, headache: 1 },
    baseProbability: 20,
    recommendations: [
      "Acquire a diagnostic blood smear test",
      "Avoid stagnant water and mosquito habitats",
      "Antimalarial regimen as prescribed by clinician"
    ]
  },
  {
    name: "Dengue",
    symptoms: { fever: 1, body_ache: 1, headache: 1, nausea: 1, fatigue: 1 },
    baseProbability: 22,
    recommendations: [
      "Prevent dehydration; monitor platelet counts",
      "Do not take NSAIDs like ibuprofen",
      "Watch for internal bleeding triggers"
    ]
  },
  {
    name: "Typhoid",
    symptoms: { fever: 1, headache: 1, nausea: 1, fatigue: 1 },
    baseProbability: 18,
    recommendations: [
      "Acquire Widal or blood culture test",
      "Consume fully boiled water and freshly prepared foods",
      "Rest extensively of digestive strains"
    ]
  },
  {
    name: "Common Cold",
    symptoms: { cough: 1, headache: 1, fatigue: 0, fever: 0 },
    baseProbability: 15,
    recommendations: [
      "Consume warm fluids regularly",
      "Leverage steam inhalation for symptomatic relief",
      "Self-limiting condition, standard recovery in 5-7 days"
    ]
  }
];

export function predictDisease(input: SymptomData) {
  const result: Array<{ name: string; probability: number; recommendations: string[] }> = [];

  for (const d of diseases) {
    let matches = 0;
    let totalTargetSymptoms = 0;

    const symptomKeys = Object.keys(d.symptoms) as Array<keyof SymptomData>;
    for (const key of symptomKeys) {
      const targetVal = d.symptoms[key];
      const inputVal = input[key];
      totalTargetSymptoms++;

      if (targetVal === inputVal) {
        matches++;
      }
    }

    const matchRatio = matches / (totalTargetSymptoms || 1);
    const scoreVal = Math.round(matchRatio * 75 + d.baseProbability * 0.25);
    const finalProbability = Math.min(Math.max(scoreVal, 10), 96);

    result.push({
      name: d.name,
      probability: finalProbability,
      recommendations: d.recommendations
    });
  }

  result.sort((a, b) => b.probability - a.probability);
  const top3 = result.slice(0, 3);

  const seeDoctorImmediately = input.chest_pain === 1 || input.shortness_of_breath === 1;

  return {
    predictions: top3,
    seeDoctorImmediately
  };
}

let aiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

export const GEMINI_MODEL = "gemini-3.5-flash";
