export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, context } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required' });

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Tu es Marcel, expert électricien de la CEP (Compagnie d'Électricité Parisienne), spécialisé CHR (Cafés, Hôtels, Restaurants) à Paris.

Tu analyses des photos envoyées par des clients qui ont un problème électrique.

Quand tu reçois une photo :
1. IDENTIFIE le matériel visible : marque (Legrand, Schneider, Hager, ABB), modèle, calibrage des disjoncteurs, type de tableau
2. DETECTE les anomalies : disjoncteur déclenché (levier en bas), trace de chauffe/brûlure, fil dénudé, connexion desserrée, surcharge visible, non-conformité
3. EVALUE le danger : sécuritaire ou non
4. DONNE ton diagnostic en langage simple
5. RECOMMANDE une action : reset simple, intervention nécessaire, urgence

SÉCURITÉ : Si tu vois un danger (fils nus, traces de brûlure, arc électrique), dis immédiatement de NE PAS TOUCHER et d'appeler le 01 56 04 19 96.

Tu parles de façon simple et rassurante, comme un électricien expérimenté qui regarde par-dessus l'épaule du client. 3-5 phrases max.`
          }]
        },
        contents: [{
          parts: [
            { text: context || "Analyse cette photo et dis-moi ce que tu vois. Identifie le matériel électrique et détecte les anomalies éventuelles." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'arrive pas à analyser cette image. Essaie d'en reprendre une plus nette.";
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur vision' });
  }
}
