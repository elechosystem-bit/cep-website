// Marcel Memory - Lit les bons d'intervention et stocke les diagnostics
// Utilise l'API REST Firestore (pas besoin de SDK)

const FIREBASE_PROJECT = 'bon-d-intervention-cep';
const FIREBASE_API_KEY = 'AIzaSyAuX2gsGiRGqVbsk93y0wmwJOsT-RuEkE4';

// Lire les derniers bons d'intervention pour un client
async function getBonsForClient(clientName) {
  try {
    // Chercher dans la collection societes/CEP/bons
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/societes/CEP/bons?key=${FIREBASE_API_KEY}&pageSize=20&orderBy=date desc`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents
      .filter(doc => {
        const fields = doc.fields || {};
        const client = fields.client?.stringValue || fields.nomClient?.stringValue || '';
        if (!clientName) return true;
        return client.toLowerCase().includes(clientName.toLowerCase());
      })
      .slice(0, 10)
      .map(doc => {
        const f = doc.fields || {};
        return {
          client: f.client?.stringValue || f.nomClient?.stringValue || '',
          date: f.date?.stringValue || f.date?.timestampValue || '',
          description: f.description?.stringValue || f.travaux?.stringValue || '',
          materiel: f.materiel?.stringValue || '',
          statut: f.statut?.stringValue || '',
          type: f.type?.stringValue || f.typeIntervention?.stringValue || ''
        };
      });
  } catch (e) {
    return [];
  }
}

// Stocker un diagnostic Marcel
async function saveDiagnostic(diagnostic) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/marcel_diagnostics?key=${FIREBASE_API_KEY}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          date: { timestampValue: new Date().toISOString() },
          client: { stringValue: diagnostic.client || 'inconnu' },
          probleme: { stringValue: diagnostic.probleme || '' },
          diagnostic: { stringValue: diagnostic.diagnostic || '' },
          resolu: { booleanValue: diagnostic.resolu || false }
        }
      })
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, clientName, diagnostic } = req.body;

  if (action === 'getBons') {
    const bons = await getBonsForClient(clientName);
    return res.status(200).json({ bons });
  }

  if (action === 'saveDiagnostic') {
    await saveDiagnostic(diagnostic);
    return res.status(200).json({ ok: true });
  }

  res.status(400).json({ error: 'Action inconnue' });
}
