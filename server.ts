import express from "express";
import path from "path";
import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { createRequire } from "module";
import { GoogleGenAI, Type } from "@google/genai";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Multer in-memory storage configuration
const upload = multer({ storage: multer.memoryStorage() });

// Lazy-initialized Gemini client creator
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Configure this in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Decision Tree / Symptom Matcher Model classification logic
interface SymptomData {
  fever: number;
  cough: number;
  fatigue: number;
  headache: number;
  nausea: number;
  chest_pain: number;
  shortness_of_breath: number;
  body_ache: number;
}

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
    recommendations: ["Rest, maintain standard hydration levels", "Use fever-reducing medication if advised", "Avoid core physical stressors"]
  },
  {
    name: "COVID-19",
    symptoms: { fever: 1, cough: 1, fatigue: 1, shortness_of_breath: 1, headache: 1 },
    baseProbability: 40,
    recommendations: ["Self-isolate in a well-ventilated room", "Track oxygen saturation levels", "Consult a general physician if breathing restricts"]
  },
  {
    name: "Pneumonia",
    symptoms: { cough: 1, fever: 1, shortness_of_breath: 1, chest_pain: 1, fatigue: 1 },
    baseProbability: 25,
    recommendations: ["Urgent clinical validation typically required", "Sputum cultures or chest radiograph recommended", "Antibiotic or supportive therapies"]
  },
  {
    name: "Malaria",
    symptoms: { fever: 1, body_ache: 1, fatigue: 1, nausea: 1, headache: 1 },
    baseProbability: 20,
    recommendations: ["Acquire a diagnostic blood smear test", "Avoid stagnant water and mosquito habitats", "Antimalarial regimen as prescribed by clinician"]
  },
  {
    name: "Dengue",
    symptoms: { fever: 1, body_ache: 1, headache: 1, nausea: 1, fatigue: 1 },
    baseProbability: 22,
    recommendations: ["Prevent dehydration; monitor platelet counts", "Do not take NSAIDs like ibuprofen", "Watch for internal bleeding triggers"]
  },
  {
    name: "Typhoid",
    symptoms: { fever: 1, headache: 1, nausea: 1, fatigue: 1 },
    baseProbability: 18,
    recommendations: ["Acquire Widal or blood culture test", "Consume fully boiled water and freshly prepared foods", "Rest extensively of digestive strains"]
  },
  {
    name: "Common Cold",
    symptoms: { cough: 1, headache: 1, fatigue: 0, fever: 0 },
    baseProbability: 15,
    recommendations: ["Consume warm fluids regularly", "Leverage steam inhalation for symptomatic relief", "Self-limiting condition, standard recovery in 5-7 days"]
  }
];

// Calculate top matching diseases simulating a decision tree partitioning
function predictDisease(input: SymptomData) {
  const result: Array<{ name: string; probability: number; recommendations: string[] }> = [];

  // Match input values against disease centroids
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

    // Mathematical matching score with fallback baseline scaling
    const matchRatio = matches / (totalTargetSymptoms || 1);
    const scoreVal = Math.round(matchRatio * 75 + d.baseProbability * 0.25);
    const finalProbability = Math.min(Math.max(scoreVal, 10), 96); // Keep cleanly contained between 10% and 96%
    
    result.push({
      name: d.name,
      probability: finalProbability,
      recommendations: d.recommendations
    });
  }

  // Sort and pick top 3
  result.sort((a, b) => b.probability - a.probability);
  const top3 = result.slice(0, 3);

  // Check see doctor immediately conditions
  const seeDoctorImmediately = input.chest_pain === 1 || input.shortness_of_breath === 1;

  return {
    predictions: top3,
    seeDoctorImmediately
  };
}

function listenWithFallback(
  httpServer: ReturnType<typeof createHttpServer>,
  port: number,
  host = "0.0.0.0",
  attempts = 10,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryListen = (nextPort: number, remainingAttempts: number) => {
      const onError = (err: NodeJS.ErrnoException) => {
        httpServer.off("listening", onListening);

        if (err.code === "EADDRINUSE" && remainingAttempts > 1) {
          tryListen(nextPort + 1, remainingAttempts - 1);
          return;
        }

        reject(err);
      };

      const onListening = () => {
        httpServer.off("error", onError);
        resolve(nextPort);
      };

      httpServer.once("error", onError);
      httpServer.once("listening", onListening);
      httpServer.listen(nextPort, host);
    };

    tryListen(port, attempts);
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = createHttpServer(app);

  // Enable JSON request body parsing
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "MediSense AI is running" });
  });

  app.post("/api/analyze-report", upload.single("report"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No report file was provided." });
      }

      let extractedText = "";
      if (req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf")) {
        try {
          const data = await pdfParse(req.file.buffer);
          extractedText = data.text || "";
        } catch (pdfErr) {
          console.error("PDF parsing error:", pdfErr);
          // Fallback to text string representation in case pdf-parse had an issue with encrypted contents
          extractedText = req.file.buffer.toString("utf-8");
        }
      } else {
        extractedText = req.file.buffer.toString("utf-8");
      }

      const trimmedText = extractedText.trim();
      if (!trimmedText || trimmedText.length === 0) {
        return res.status(400).json({ 
          error: "Could not retrieve legible text parameters. Ensure the file contains text layers (non-scanned or OCR-indexed)." 
        });
      }

      const ai = getGeminiClient();
      const modelName = "gemini-3.5-flash";

      const prompt = `Extract all clinical parameters and physiological metrics from this medical report.
Raw text extracted:
"""
${trimmedText}
"""

Please identify standard metrics (like Hb, white cell counts, vitamins, thyroid hormone, cholesterol, glucose, blood pressure, etc.). Match values to normal reference intervals and flag abnormalities as High, Low, or Normal. Build a warm, clear 3-line health summary in friendly plain English.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    parameter: { type: Type.STRING, description: "Normalized parameter name (e.g., Hemoglobin, Blood Urea Nitrogen, HDL Cholesterol)" },
                    value: { type: Type.STRING, description: "Value of the parameter (e.g., 14.2, 5.4, 185)" },
                    unit: { type: Type.STRING, description: "Metric units of measurement (e.g., g/dL, mg/dL, pg/mL)" },
                    normal_range: { type: Type.STRING, description: "Normal boundaries (e.g., 12.0 - 16.0 or < 200)" },
                    status: { type: Type.STRING, description: "Status relative to normal boundaries: 'High', 'Low', or 'Normal'" }
                  },
                  required: ["parameter", "value", "unit", "normal_range", "status"]
                }
              },
              summary: { type: Type.STRING, description: "Empathetic, clear, 3-line plain-English medical summary of results" }
            },
            required: ["parameters", "summary"]
          },
          systemInstruction: "You are an expert medical diagnostic report analyzer. Your job is to extract laboratory results accurately, map boundaries correctly, and construct a warm summary. Do not inject medical jargon in the summary; keep it understandable to patient.",
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty diagnostic evaluation payload from Gemini AI.");
      }

      const parsedJSON = JSON.parse(text.trim());
      return res.json(parsedJSON);

    } catch (err: any) {
      console.error("Clinical analyzer routine error:", err);
      return res.status(500).json({ 
        error: err.message || "A diagnostic error occurred during report evaluation." 
      });
    }
  });

  app.post("/api/predict", (req, res) => {
    const defaultSymptoms: SymptomData = {
      fever: 0,
      cough: 0,
      fatigue: 0,
      headache: 0,
      nausea: 0,
      chest_pain: 0,
      shortness_of_breath: 0,
      body_ache: 0,
    };

    // Override with requested properties
    const input: SymptomData = { ...defaultSymptoms, ...req.body };

    const predictionsResult = predictDisease(input);
    res.json(predictionsResult);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "No message parameter provided." });
      }

      const ai = getGeminiClient();
      const modelName = "gemini-3.5-flash";

      // Safely map incoming chat timeline parameters
      const mappedHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text || h.message || "" }]
      }));

      const chatSession = ai.chats.create({
        model: modelName,
        history: mappedHistory,
        config: {
          systemInstruction: "You are MediSense AI doctor assistant. Be empathetic, brief, clear. Never diagnose. Always suggest consulting a real doctor for serious concerns.",
          temperature: 0.7,
        }
      });

      const response = await chatSession.sendMessage({ message });
      const text = response.text;

      if (!text) {
        throw new Error("Empty diagnostic reply from Gemini service.");
      }

      return res.json({ text });
    } catch (err: any) {
      console.error("Clinical chatbot loop error:", err);
      return res.status(500).json({ 
        error: err.message || "A backend diagnostic processing error occurred." 
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const actualPort = await listenWithFallback(httpServer, PORT);
  console.log(`Server started on http://0.0.0.0:${actualPort}`);
}

startServer();
