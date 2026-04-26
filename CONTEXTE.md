# CEP Website

## Description
Site vitrine statique pour la **Compagnie d'Electricite Parisienne (CEP)**. Page unique presentant l'entreprise, ses services et ses coordonnees.

## Stack Technique
- HTML/CSS/JS (fichier unique index.html ~1.2 MB)
- Deploiement via FTP (basic-ftp, Node.js script)
- Hebergement OVH (ftp.cluster121.hosting.ovh.net)
- Variables d'environnement dans .env

## URL
- Hebergement OVH (FTP deploy)

## Deploiement
```bash
npm run deploy
```
Utilise `deploy.js` qui envoie index.html via FTP sur le serveur OVH.

## Etat Actuel
**Fonctionnel** - Site deploye et en ligne. 2 commits (initialisation + contenu).

## Ce Qui Reste a Faire
- Clarifier le processus de build (comment le HTML de 1.2 MB est genere)
- Separer le CSS/JS du HTML si necessaire pour la maintenabilite
- Optimiser les performances (compression, lazy loading)
- Mettre en place un vrai pipeline de deploiement (CI/CD)
