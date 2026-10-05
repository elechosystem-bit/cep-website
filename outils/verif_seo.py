#!/usr/bin/env python3
"""Contrôle du référencement du site CEP (cep75.fr) : lecture seule, aucune modification.

Usage : python3 outils/verif_seo.py            -> audit complet (quotidien)
        python3 outils/verif_seo.py --rapide   -> le site répond-il ? (horaire)

Code de sortie 1 si une ERREUR est trouvée (GitHub envoie alors un mail).
Les AVERTISSEMENTS ne font pas échouer : ce sont des pistes d'amélioration.
"""
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

SITE = "https://www.cep75.fr"
PAGES_PRIVEES = ("mon-espace.html",)      # volontairement non indexées
erreurs, avertissements = [], []


def lire(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (controle-seo CEP75)", "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", errors="replace"), 0
    except urllib.error.HTTPError as e:
        return e.code, "", 0
    except Exception as e:
        return 0, "", 0


def erreur(msg):
    erreurs.append(msg)
    print("ERREUR       " + msg)


def avert(msg):
    avertissements.append(msg)
    print("avertissement " + msg)


def rapide():
    for chemin in ("/", "/sitemap.xml"):
        statut, _, _ = lire(SITE + chemin)
        if statut != 200:
            erreur("%s ne répond pas correctement (code %s)" % (chemin, statut))
        else:
            print("ok           %s répond" % chemin)


def balise(html, motif):
    m = re.search(motif, html, re.S | re.I)
    return m.group(1).strip() if m else ""


def page(chemin, indexee=True):
    url = SITE + chemin
    statut, html, _ = lire(url)
    if statut != 200:
        erreur("%s : code %s" % (chemin, statut))
        return ""
    poids = len(html.encode("utf-8")) // 1024
    titre = balise(html, r"<title>(.*?)</title>")
    desc = balise(html, r'<meta name="description" content="(.*?)"')
    if not titre:
        erreur("%s : pas de titre" % chemin)
    elif indexee and not 25 <= len(titre) <= 70:
        avert("%s : titre de %d caractères (visé : 25 à 70)" % (chemin, len(titre)))
    if indexee:
        if not desc:
            erreur("%s : pas de description" % chemin)
        elif not 70 <= len(desc) <= 165:
            avert("%s : description de %d caractères (visé : 70 à 165)" % (chemin, len(desc)))
        if not re.search(r'rel="canonical"', html):
            erreur("%s : pas d'adresse canonique" % chemin)
        if re.search(r'<meta name="robots" content="[^"]*noindex', html, re.I):
            erreur("%s : marquée noindex alors qu'elle doit être référencée" % chemin)
        nb_h1 = len(re.findall(r"<h1[\s>]", html, re.I))
        if nb_h1 != 1:
            avert("%s : %d titre(s) principal(aux) h1 (visé : 1)" % (chemin, nb_h1))
    sans_alt = [m for m in re.findall(r"<img[^>]*>", html, re.I) if "alt=" not in m.lower()]
    if sans_alt:
        avert("%s : %d image(s) sans texte alternatif" % (chemin, len(sans_alt)))
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            json.loads(bloc)
        except Exception:
            erreur("%s : données structurées (JSON-LD) invalides" % chemin)
    if poids > 600:
        avert("%s pèse %d Ko (visé : sous 600 Ko) : lent sur téléphone, pénalisé par Google" % (chemin, poids))
    print("contrôlée    %s (%d Ko)" % (chemin, poids))
    return html


def complet():
    statut, robots, _ = lire(SITE + "/robots.txt")
    if statut != 200:
        erreur("robots.txt introuvable")
    elif "Sitemap:" not in robots:
        avert("robots.txt ne cite pas le plan du site")
    statut, sitemap, _ = lire(SITE + "/sitemap.xml")
    if statut != 200:
        erreur("sitemap.xml introuvable")
        return
    adresses = re.findall(r"<loc>(.*?)</loc>", sitemap)
    if not adresses:
        erreur("sitemap.xml ne contient aucune adresse")
    for adr in adresses:
        chemin = urllib.parse.urlparse(adr).path or "/"
        page(chemin)
    for privee in PAGES_PRIVEES:
        page("/" + privee, indexee=False)
    # liens internes de l'accueil
    accueil = page("/")
    vus = set()
    for lien in re.findall(r'href="([^"#]+\.html)(?:#[^"]*)?"', accueil):
        if lien.startswith(("http", "mailto", "tel")) or lien in vus:
            continue
        vus.add(lien)
        code, _, _ = lire(SITE + "/" + lien.lstrip("/"))
        if code != 200:
            erreur("lien cassé depuis l'accueil : %s (code %s)" % (lien, code))


if __name__ == "__main__":
    rapide() if "--rapide" in sys.argv else complet()
    print()
    print("%d erreur(s), %d avertissement(s)" % (len(erreurs), len(avertissements)))
    if erreurs:
        sys.exit(1)
    print("Tout est en ordre" if not avertissements else "Rien de cassé ; des pistes d'amélioration sont listées ci-dessus")
