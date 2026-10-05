<?php
// Réception des demandes du site CEP75 (devis, dépannage, rapport de contrôle avec pièces jointes).
// Envoie un mail à contact@cep75.fr. Rien n'est enregistré sur le serveur : les fichiers sont
// lus puis joints au mail, jamais écrits sur le disque.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const DESTINATAIRE = 'contact@cep75.fr';
const EXPEDITEUR   = 'contact@cep75.fr';
const MAX_TOTAL    = 12 * 1024 * 1024;   // 12 Mo de pièces jointes au total
const MAX_FICHIERS = 6;
const MAX_PAR_HEURE = 6;                 // demandes par adresse IP et par heure
const TYPES_OK = [
    'pdf'  => ['application/pdf'],
    'jpg'  => ['image/jpeg'], 'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
    'webp' => ['image/webp'],
    'heic' => ['image/heic', 'image/heif', 'application/octet-stream'],
];

function repondre(bool $ok, string $msg = '', int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function champ(string $cle, int $max): string {
    $v = trim((string)($_POST[$cle] ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

function une_ligne(string $s): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $s) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    repondre(false, 'Méthode non autorisée.', 405);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_TOTAL + 1024 * 1024) {
    repondre(false, 'Fichiers trop lourds (12 Mo maximum au total).', 413);
}

// Piège à robots : ce champ reste vide pour une vraie personne.
if (champ('site_web', 100) !== '') {
    repondre(true);
}

$type    = champ('type', 20);
$nom     = champ('nom', 120);
$etab    = champ('etab', 160);
$tel     = champ('tel', 40);
$email   = champ('email', 160);
$adresse = champ('adresse', 200);
$urgence = champ('urgence', 80);
$sujetDemande = champ('probleme', 120);
$message = champ('message', 4000);

if (!in_array($type, ['devis', 'depannage', 'rapport'], true)) {
    repondre(false, 'Demande incomplète.', 400);
}
if ($tel === '' && $email === '') {
    repondre(false, 'Indiquez un téléphone ou un email pour que nous puissions vous répondre.', 400);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre(false, 'L\'adresse email semble incorrecte.', 400);
}
if ($tel !== '' && !preg_match('/^[0-9 +().\-]{6,40}$/', $tel)) {
    repondre(false, 'Le numéro de téléphone semble incorrect.', 400);
}

// Pièces jointes
$pieces = [];
$total = 0;
if (!empty($_FILES['fichiers']) && is_array($_FILES['fichiers']['name'])) {
    $n = count($_FILES['fichiers']['name']);
    if ($n > MAX_FICHIERS) {
        repondre(false, 'Six fichiers maximum.', 400);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    for ($i = 0; $i < $n; $i++) {
        $erreur = $_FILES['fichiers']['error'][$i];
        if ($erreur === UPLOAD_ERR_NO_FILE) { continue; }
        if ($erreur !== UPLOAD_ERR_OK) {
            repondre(false, 'Un fichier n\'a pas pu être reçu. Réessayez.', 400);
        }
        $tmp  = $_FILES['fichiers']['tmp_name'][$i];
        $orig = (string)$_FILES['fichiers']['name'][$i];
        if (!is_uploaded_file($tmp)) { continue; }
        $taille = (int)$_FILES['fichiers']['size'][$i];
        $total += $taille;
        if ($taille <= 0 || $total > MAX_TOTAL) {
            repondre(false, 'Fichiers trop lourds (12 Mo maximum au total).', 413);
        }
        $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
        $mime = (string)$finfo->file($tmp);
        if (!isset(TYPES_OK[$ext]) || !in_array($mime, TYPES_OK[$ext], true)) {
            repondre(false, 'Formats acceptés : PDF, JPG, PNG, WEBP, HEIC.', 400);
        }
        $nomSur = preg_replace('/[^A-Za-z0-9._ -]/', '_', pathinfo($orig, PATHINFO_FILENAME)) ?: 'fichier';
        $pieces[] = ['nom' => mb_substr($nomSur, 0, 60) . '.' . $ext, 'mime' => $mime === 'application/octet-stream' ? 'image/heic' : $mime,
                     'data' => file_get_contents($tmp)];
    }
}
if ($type === 'rapport' && count($pieces) === 0) {
    repondre(false, 'Ajoutez votre rapport (PDF ou photos) avant d\'envoyer.', 400);
}

// Limite par adresse IP (fichier temporaire, sans donnée personnelle conservée)
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0');
$fichierLimite = sys_get_temp_dir() . '/cep_rl_' . md5($ip);
$maintenant = time();
$historique = [];
if (is_file($fichierLimite)) {
    foreach (explode(',', (string)file_get_contents($fichierLimite)) as $t) {
        if ($t !== '' && $maintenant - (int)$t < 3600) { $historique[] = (int)$t; }
    }
}
if (count($historique) >= MAX_PAR_HEURE) {
    repondre(false, 'Trop de demandes en peu de temps. Réessayez plus tard ou appelez le 01 56 04 19 96.', 429);
}
$historique[] = $maintenant;
@file_put_contents($fichierLimite, implode(',', $historique), LOCK_EX);

// Mail
$etiquettes = ['devis' => 'Demande de devis', 'depannage' => 'DÉPANNAGE', 'rapport' => 'Rapport de contrôle reçu'];
$sujet = '[Site CEP75] ' . $etiquettes[$type] . ($etab !== '' ? ' — ' . $etab : ($nom !== '' ? ' — ' . $nom : ''));
$sujet = une_ligne($sujet);

$lignes = [$etiquettes[$type], str_repeat('-', 40)];
foreach ([
    'Nom' => $nom, 'Établissement' => $etab, 'Téléphone' => $tel, 'Email' => $email,
    'Adresse' => $adresse, 'Urgence' => $urgence, 'Type' => $sujetDemande,
] as $libelle => $valeur) {
    if ($valeur !== '') { $lignes[] = $libelle . ' : ' . $valeur; }
}
if ($message !== '') { $lignes[] = ''; $lignes[] = 'Message :'; $lignes[] = $message; }
if ($pieces) { $lignes[] = ''; $lignes[] = 'Pièces jointes : ' . count($pieces); }
$lignes[] = '';
$lignes[] = 'Envoyé depuis le site cep75.fr le ' . date('d/m/Y à H:i');
$texte = implode("\r\n", $lignes);

$frontiere = '=_cep_' . bin2hex(random_bytes(12));
$entetes = [
    'From: Site CEP75 <' . EXPEDITEUR . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $frontiere . '"',
    'X-Mailer: CEP75-site',
];
if ($email !== '') {
    $entetes[] = 'Reply-To: ' . une_ligne($email);
}
$corps = "--$frontiere\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" . $texte . "\r\n";
foreach ($pieces as $p) {
    $corps .= "--$frontiere\r\nContent-Type: {$p['mime']}; name=\"{$p['nom']}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$p['nom']}\"\r\n\r\n"
            . chunk_split(base64_encode($p['data'])) . "\r\n";
}
$corps .= "--$frontiere--";

$ok = mail(DESTINATAIRE, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $corps, implode("\r\n", $entetes), '-f' . EXPEDITEUR);
if (!$ok) {
    repondre(false, 'L\'envoi a échoué. Appelez-nous au 01 56 04 19 96.', 500);
}
repondre(true, 'Demande reçue.');
