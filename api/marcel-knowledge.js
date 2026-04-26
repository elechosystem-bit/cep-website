// Base de connaissances Marcel - Procédures de dépannage électrique CHR
// Stocke et récupère les procédures depuis Firebase

const FIREBASE_PROJECT = 'bon-d-intervention-cep';
const FIREBASE_API_KEY = 'AIzaSyAuX2gsGiRGqVbsk93y0wmwJOsT-RuEkE4';

const PROCEDURES = [
  {
    id: "disjoncteur_general_saute",
    titre: "Le disjoncteur général saute",
    symptomes: ["général saute", "plus de courant", "coupure totale", "tout saute", "black out", "plus rien", "général qui saute"],
    procedure: `DIAGNOSTIC : Court-circuit ou surcharge sur un circuit.
ÉTAPES :
1. Baisser TOUS les disjoncteurs divisionnaires (les petits derrière le général)
2. Remonter le disjoncteur général seul
3. Si le général tient → remonter les divisionnaires UN PAR UN (attendre 5 secondes entre chaque)
4. Quand ça resaute → le dernier remonté est le circuit fautif. Le laisser en bas
5. Remonter le général et tous les autres → le courant revient partout sauf sur ce circuit
6. Aller débrancher les appareils sur le circuit fautif (lire l'étiquette du disjoncteur)
7. Remonter le disjoncteur fautif :
   - S'il tient → c'est l'appareil qui est en court-circuit (HS ou à réviser)
   - S'il resaute → c'est le câblage du circuit, il faut un technicien
CONSEIL : En CHR, les causes les plus fréquentes sont le four pro (32A), le lave-vaisselle (20A), la machine à glaçons ou la hotte aspirante encrassée.`
  },
  {
    id: "differentiel_saute",
    titre: "Le différentiel saute (interrupteur différentiel)",
    symptomes: ["différentiel", "fuite", "rcd", "30ma", "inter diff", "gros interrupteur", "différentiel qui saute"],
    procedure: `DIAGNOSTIC : Fuite de courant à la terre sur un appareil ou un câble.
ÉTAPES :
1. Identifier l'interrupteur différentiel (le plus gros, souvent 40A ou 63A, avec un bouton TEST)
2. Appuyer sur le bouton TEST → il doit sauter (ça veut dire qu'il fonctionne)
3. Baisser TOUS les disjoncteurs derrière ce différentiel
4. Remonter le différentiel
5. Remonter les disjoncteurs UN PAR UN
6. Quand le différentiel saute → c'est le dernier circuit remonté qui a la fuite
7. Le laisser en bas, remonter les autres
8. Débrancher l'appareil suspect sur ce circuit, remonter le disjoncteur :
   - Ça tient → l'appareil a un défaut d'isolement (fuite à la terre)
   - Ça resaute → le câblage a un défaut, il faut un technicien
CONSEIL : En CHR, les fuites viennent souvent d'appareils en contact avec l'eau : lave-vaisselle, machine à glaçons, chambre froide, four vapeur.`
  },
  {
    id: "zone_sans_courant",
    titre: "Plus de courant sur une zone (prises ou éclairage)",
    symptomes: ["plus de prise", "prise marche pas", "plus de lumière", "éclairage", "une partie", "une zone", "pas de courant"],
    procedure: `DIAGNOSTIC : Disjoncteur déclenché ou fil coupé.
ÉTAPES :
1. Aller au tableau électrique
2. Vérifier si un disjoncteur est en position basse (OFF) → le remonter
3. S'il tient → c'est réglé, il a simplement sauté (surcharge momentanée)
4. S'il resaute → procédure d'isolation (débrancher tout sur ce circuit, remonter un par un)
5. Si AUCUN disjoncteur n'est en bas → le problème est en aval :
   - Tester une prise avec un chargeur de téléphone
   - Tester l'interrupteur d'éclairage
   - Si rien ne fonctionne et le disjoncteur est en haut → connexion lâche ou fil coupé → technicien nécessaire
CONSEIL : Vérifier aussi les boîtes de dérivation accessibles (souvent en faux plafond en CHR).`
  },
  {
    id: "appareil_fait_sauter",
    titre: "Un appareil fait sauter le disjoncteur dès qu'on l'allume",
    symptomes: ["appareil saute", "quand j'allume", "dès que je branche", "fait sauter", "four saute", "lave-vaisselle saute", "machine saute"],
    procedure: `DIAGNOSTIC : Court-circuit dans l'appareil ou calibre disjoncteur insuffisant.
ÉTAPES :
1. Identifier l'appareil (four, lave-vaisselle, hotte, chambre froide, machine à glaçons)
2. Le débrancher complètement (prise ou bornier)
3. Remonter le disjoncteur :
   - Il tient → l'appareil est en court-circuit ou en surintensité
   - Il resaute → le problème est sur le câblage, pas l'appareil
4. Vérifier le calibre du disjoncteur par rapport à l'appareil :
   - Four pro : doit être sur 32A (pas 20A ou 16A)
   - Lave-vaisselle pro : 20A minimum
   - Chambre froide : 16A ou 20A selon modèle, circuit DÉDIÉ
   - Hotte : 10A ou 16A
   - Machine à glaçons : 16A
   - Terrasse chauffante : circuit dédié 20A ou 32A selon puissance
5. Si le calibre est trop faible → il faut un technicien pour adapter le circuit
CONSEIL : Un four pro sur un disjoncteur 16A ou 20A sautera TOUJOURS. C'est la cause n°1 en CHR.`
  },
  {
    id: "eclairage_clignote",
    titre: "Éclairage qui clignote, grésille ou faiblit",
    symptomes: ["clignote", "grésille", "grésillement", "lumière faible", "scintille", "vacille", "néon clignote"],
    procedure: `DIAGNOSTIC : Ampoule défectueuse, driver LED HS, ballast néon fatigué, ou faux contact.
ÉTAPES :
1. C'est UNE lampe ou TOUT l'éclairage ?
2. UNE lampe :
   - Changer l'ampoule/tube → si ça continue c'est le driver (LED) ou le ballast (néon)
   - Vérifier le serrage de l'ampoule dans la douille
   - Si c'est un spot encastré : vérifier le transformateur
3. TOUT l'éclairage :
   - Vérifier le serrage des connexions au tableau (les vis des disjoncteurs éclairage)
   - Si tout l'éclairage faiblit puis revient → problème de neutre → TECHNICIEN URGENT
4. SI ÇA GRÉSILLE : couper le circuit au tableau → un grésillement = faux contact qui chauffe = risque d'incendie
CONSEIL : Les drivers LED bon marché ont une durée de vie de 2-3 ans en CHR (allumage prolongé). Prévoir le remplacement.`
  },
  {
    id: "prise_chauffe",
    titre: "Prise qui chauffe, noircit ou sent le brûlé",
    symptomes: ["chauffe", "noircit", "brûlé", "odeur", "chaud", "prise chaude", "sent le brûlé", "fumée"],
    procedure: `⚠️ URGENCE SÉCURITÉ
ÉTAPES :
1. DÉBRANCHER immédiatement l'appareil de cette prise
2. COUPER le disjoncteur de ce circuit au tableau
3. NE PAS réutiliser cette prise
4. Ventiler si odeur de brûlé
5. Vérifier visuellement : la prise est-elle noircie ? Le plastique est-il fondu ?
6. Appeler le 01 56 04 19 96 pour remplacement
CAUSE : Faux contact dans la prise → résistance → échauffement → risque d'incendie. Souvent causé par une prise bas de gamme ou un appareil trop puissant sur une prise simple (ex: four branché sur une prise 16A au lieu d'une sortie de câble 32A).`
  },
  {
    id: "tableau_bruyant",
    titre: "Tableau électrique qui vibre, bourdonne ou chauffe",
    symptomes: ["tableau vibre", "bourdonne", "bruit tableau", "tableau chaud", "contacteur", "ronronne"],
    procedure: `DIAGNOSTIC : Contacteur défectueux ou connexion lâche.
ÉTAPES :
1. Le bruit vient d'un contacteur (pièce qui claque) ? → Normal s'il claque 1 fois. Anormal s'il vibre en continu
2. Un contacteur qui vibre en continu = bobine fatiguée ou tension instable → couper le circuit concerné
3. Le tableau est CHAUD au toucher ? → COUPER LE GÉNÉRAL et appeler 01 56 04 19 96
4. Simple bourdonnement léger d'un transfo ou d'un contacteur jour/nuit → généralement pas grave mais à surveiller
CONSEIL : Les contacteurs jour/nuit pour chauffe-eau font souvent du bruit en fin de vie. Remplacement simple par un technicien.`
  },
  {
    id: "disjoncteur_ne_remonte_pas",
    titre: "Disjoncteur impossible à remonter",
    symptomes: ["remonte pas", "impossible remonter", "reste en bas", "bloqué", "ne tient pas", "retombe"],
    procedure: `DIAGNOSTIC : Court-circuit franc sur le circuit ou disjoncteur HS.
ÉTAPES :
1. Le disjoncteur retombe IMMÉDIATEMENT quand tu le remontes ?
   → Court-circuit franc. Débrancher TOUS les appareils sur ce circuit, puis réessayer
2. Tous les appareils débranchés et ça retombe toujours ?
   → Le court-circuit est dans le câblage (fil coupé/écrasé, boîte de dérivation, prise murale)
   → Laisser en bas et appeler un technicien
3. Le disjoncteur ne bouge pas du tout (mécaniquement bloqué) ?
   → Le disjoncteur est HS, ne pas forcer → technicien pour remplacement
CONSEIL : En CHR, les courts-circuits francs viennent souvent de fils écrasés par du mobilier déplacé, de perçages dans les murs qui touchent un câble, ou de nuisibles (rats) qui rongent les gaines.`
  },
  {
    id: "coupures_intermittentes",
    titre: "Coupures de courant intermittentes (ça coupe et ça revient)",
    symptomes: ["intermittent", "coupe et revient", "aléatoire", "de temps en temps", "parfois", "coupures répétées"],
    procedure: `DIAGNOSTIC : Faux contact, surcharge intermittente, ou problème thermique.
ÉTAPES :
1. C'est TOUJOURS le même circuit qui saute ?
   → Vérifier le serrage des connexions au tableau (technicien recommandé)
2. C'est le général ou le différentiel ?
   - Général → surcharge quand plusieurs gros appareils tournent en même temps
   - Différentiel → un appareil avec fuite intermittente (souvent lié à la chaleur ou l'humidité)
3. Ça arrive à certains moments ? (service du midi, plein été, après la pluie)
   - Service = surcharge (tout tourne en même temps)
   - Été = thermique (un appareil surchauffe)
   - Pluie = infiltration d'eau quelque part
4. En attendant le technicien : noter les heures exactes des coupures et quel disjoncteur saute
CONSEIL : Tenir un petit carnet à côté du tableau. Ça aide énormément le technicien à diagnostiquer.`
  },
  {
    id: "normes_cuisine_pro",
    titre: "Normes électriques cuisine professionnelle CHR",
    symptomes: ["norme", "conforme", "conformité", "apave", "erp", "mise aux normes", "réglementation"],
    procedure: `NORMES APPLICABLES :
- NF C15-100 : norme générale installations électriques
- UTE C15-201 : guide spécifique grandes cuisines
- ERP : règles pour les établissements recevant du public

EXIGENCES PRINCIPALES :
1. Arrêt d'urgence : bouton coup de poing rouge obligatoire en cuisine (coupure générale)
2. Protection différentielle 30mA obligatoire sur tous les circuits
3. IP minimum : IPX5 sous 1,1m en zone de lavage, IPX3 au-dessus
4. Circuits dédiés obligatoires : four, lave-vaisselle, chambre froide, hotte
5. Câblage : section adaptée (6mm² pour 32A four, 4mm² pour 20A LV)
6. Tableau : doit être accessible, dans un local ventilé, pas dans la cuisine si possible
7. Éclairage de sécurité : blocs autonomes obligatoires (BAES)
8. Vérification périodique obligatoire par organisme agréé (APAVE, Bureau Veritas, etc.)

CALIBRES STANDARDS CHR :
- Four pro : 32A triphasé ou monophasé selon puissance
- Lave-vaisselle pro : 20A
- Chambre froide : 16A ou 20A, circuit dédié avec alarme
- Hotte : 10A ou 16A selon moteur
- Machine à glaçons : 16A
- Caisse/TPE : 16A
- Éclairage salle : 10A
- Éclairage cuisine : 10A (circuit séparé)
- Terrasse chauffante : 20A ou 32A selon puissance`
  }
];

// Injecter les procédures dans Firebase au premier appel
async function seedProcedures() {
  for (const proc of PROCEDURES) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/marcel_procedures/${proc.id}?key=${FIREBASE_API_KEY}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            titre: { stringValue: proc.titre },
            symptomes: { arrayValue: { values: proc.symptomes.map(s => ({ stringValue: s })) } },
            procedure: { stringValue: proc.procedure }
          }
        })
      });
    } catch (e) {}
  }
}

// Chercher les procédures pertinentes par mots-clés
function findRelevantProcedures(userMessage) {
  const msg = userMessage.toLowerCase();
  return PROCEDURES.filter(p =>
    p.symptomes.some(s => msg.includes(s.toLowerCase()))
  ).map(p => `### ${p.titre}\n${p.procedure}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, message } = req.body;

  if (action === 'seed') {
    await seedProcedures();
    return res.status(200).json({ ok: true, count: PROCEDURES.length });
  }

  if (action === 'search') {
    const results = findRelevantProcedures(message || '');
    return res.status(200).json({ procedures: results });
  }

  res.status(400).json({ error: 'Action inconnue' });
}
