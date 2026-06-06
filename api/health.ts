export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({ status: 'MediSense AI is running' });
}
