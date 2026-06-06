import { getGeminiClient, GEMINI_MODEL } from './_utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' });
    return;
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'No message parameter provided.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const mappedHistory = Array.isArray(history)
      ? history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text || h.message || '' }]
        }))
      : [];

    const chatSession = ai.chats.create({
      model: GEMINI_MODEL,
      history: mappedHistory,
      config: {
        systemInstruction:
          'You are MediSense AI doctor assistant. Be empathetic, brief, clear. Never diagnose. Always suggest consulting a real doctor for serious concerns.',
        temperature: 0.7
      }
    });

    const response = await chatSession.sendMessage({ message });
    const text = response.text;
    if (!text) {
      throw new Error('Empty diagnostic reply from Gemini service.');
    }

    res.status(200).json({ text });
  } catch (err: any) {
    console.error('Clinical chatbot loop error:', err);
    res.status(500).json({ error: err.message || 'A backend diagnostic processing error occurred.' });
  }
}
