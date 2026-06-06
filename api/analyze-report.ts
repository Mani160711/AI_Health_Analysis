import fs from 'node:fs/promises';
import { IncomingMessage } from 'node:http';
import { formidable } from 'formidable';
import pdfParse from 'pdf-parse';
import { getGeminiClient, GEMINI_MODEL } from './_utils';

async function parseMultipart(req: IncomingMessage) {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = formidable({ multiples: false });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { files } = await parseMultipart(req);
    const reportFile = files?.report;
    if (!reportFile) {
      res.status(400).json({ error: 'No report file was provided.' });
      return;
    }

    const file = Array.isArray(reportFile) ? reportFile[0] : reportFile;
    const filePath = file.filepath || file.filePath || file.path;
    if (!filePath) {
      res.status(500).json({ error: 'Unable to locate temporary upload file path.' });
      return;
    }

    const fileBuffer = await fs.readFile(filePath);
    const fileName: string = file.originalFilename || file.name || 'report';
    const mimeType: string = file.mimetype || file.type || '';

    let extractedText = '';
    if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const data = await pdfParse(fileBuffer);
        extractedText = data.text || '';
      } catch (pdfErr: any) {
        console.error('PDF parsing error:', pdfErr);
        extractedText = fileBuffer.toString('utf-8');
      }
    } else {
      extractedText = fileBuffer.toString('utf-8');
    }

    const trimmedText = extractedText.trim();
    if (!trimmedText) {
      res.status(400).json({
        error: 'Could not retrieve legible text parameters. Ensure the file contains text layers (non-scanned or OCR-indexed).'
      });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Extract all clinical parameters and physiological metrics from this medical report.\nRaw text extracted:\n"""\n${trimmedText}\n"""\n\nPlease identify standard metrics (like Hb, white cell counts, vitamins, thyroid hormone, cholesterol, glucose, blood pressure, etc.). Match values to normal reference intervals and flag abnormalities as High, Low, or Normal. Build a warm, clear 3-line health summary in friendly plain English.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  parameter: { type: 'string' },
                  value: { type: 'string' },
                  unit: { type: 'string' },
                  normal_range: { type: 'string' },
                  status: { type: 'string' }
                },
                required: ['parameter', 'value', 'unit', 'normal_range', 'status']
              }
            },
            summary: { type: 'string' }
          },
          required: ['parameters', 'summary']
        },
        systemInstruction:
          'You are an expert medical diagnostic report analyzer. Your job is to extract laboratory results accurately, map boundaries correctly, and construct a warm summary. Do not inject medical jargon in the summary; keep it understandable to patient.'
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty diagnostic evaluation payload from Gemini AI.');
    }

    const parsedJSON = JSON.parse(text.trim());
    res.status(200).json(parsedJSON);
  } catch (err: any) {
    console.error('Clinical analyzer routine error:', err);
    res.status(500).json({ error: err.message || 'A diagnostic error occurred during report evaluation.' });
  }
}
