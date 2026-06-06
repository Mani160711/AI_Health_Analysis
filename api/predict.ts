import { predictDisease, SymptomData } from './_utils';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const defaultSymptoms: SymptomData = {
    fever: 0,
    cough: 0,
    fatigue: 0,
    headache: 0,
    nausea: 0,
    chest_pain: 0,
    shortness_of_breath: 0,
    body_ache: 0
  };

  const input: SymptomData = { ...defaultSymptoms, ...body };
  const predictionsResult = predictDisease(input);
  res.status(200).json(predictionsResult);
}
