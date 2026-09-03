# Politique de confidentialité

**Dernière mise à jour :** September 1, 2026

Cette politique décrit la manière dont les informations sont traitées lorsque vous utilisez **Kit**, un ensemble d'utilitaires publié sous la forme d'un site web statique et conçu pour fonctionner dans votre navigateur.

## Principe essentiel

Kit est conçu pour que **le travail sur vos fichiers se fasse sur votre appareil**. Nous n'exploitons pas de serveur applicatif qui reçoit, stocke ou analyse le contenu des documents, images ou médias que vous ouvrez dans les outils.

## Ce que Kit ne fait pas

Lorsque vous utilisez les outils (par exemple pour fusionner des PDF ou compresser des images) :

- Vos fichiers ne sont **pas téléversés** vers un backend Kit pour être traités.
- Nous ne créons **pas de comptes utilisateur**.
- Nous ne vendons **pas de données personnelles**.
- Nous n'utilisons **pas de SDK publicitaires ni de suivi intersites à des fins publicitaires**.

## Informations pouvant exister autour du service

### 1. Données qui restent sur votre appareil

Votre navigateur peut stocker localement des informations limitées, telles que :

- Préférences d'apparence (clair, sombre ou système)
- Langue choisie
- Outils favoris ou épinglés
- **Résumé de l'historique** (outil utilisé, moment approximatif, brève description) — **pas** le contenu de vos fichiers
- Préréglages que vous choisissez d'enregistrer

Vous pouvez effacer l'historique dans les paramètres ou supprimer les données de ce site dans votre navigateur.

### 2. Journaux réseau et d'hébergement

Kit est généralement hébergé sous forme de fichiers statiques sur **Cloudflare Pages** (site canonique : trykit.pages.dev), avec une copie de secours sur GitHub Pages. Lorsque votre navigateur demande des pages et des ressources, l'hébergeur peut enregistrer des données techniques standard telles que l'adresse IP, l'agent utilisateur, les horodatages et les URL demandées. Ces journaux sont régis par l'infrastructure et les politiques de l'hébergeur, et non par un serveur Kit qui ouvre vos documents.

### 3. Ressources tierces facultatives

Les outils PDF chargent le worker pdf.js, les polices et les ressources associées **depuis ce même site** (fournis avec l’application). Les outils audio et vidéo chargent un moteur FFmpeg WebAssembly **depuis ce même site**. Le contenu de vos fichiers reste dans le navigateur ; ces bibliothèques sont du code applicatif, pas un endroit où nous envoyons vos documents.

Le moteur FFmpeg (`@ffmpeg/core`) est sous licence **GPL-2.0-or-later**, car il inclut des codecs tels que H.264 et LAME MP3. Le code source de Kit reste MIT. pdf.js et les autres bibliothèques conservent leurs licences Apache, BSD ou MIT.

### 4. Taux de change

Lorsque vous actualisez les taux de change, ce navigateur interroge l'API publique de Frankfurter. La requête peut partager avec Frankfurter des métadonnées réseau standard (adresse IP, agent utilisateur, heure et URL demandée, par exemple). Les taux peuvent provenir du cache de ce navigateur et être obsolètes. Il s'agit uniquement de données de référence quotidiennes, sans garantie pour le trading, la comptabilité, la fiscalité ou le règlement. Ouvrir le convertisseur ou changer de devises peut aussi interroger l’API s’il n’y a pas de taux frais en cache. Les montants saisis ne sont pas envoyés.

## Application web progressive (PWA)

Si vous installez Kit ou autorisez l'utilisation hors ligne, un service worker peut mettre en cache **le shell de l'application** (pages, scripts, styles, icônes). Kit n'est pas conçu pour stocker vos fichiers personnels dans ce cache.

## Enfants

Kit est un utilitaire généraliste. Il ne s'adresse pas aux enfants de moins de 13 ans et, comme Kit ne propose pas de comptes, nous ne recueillons pas sciemment les informations personnelles d'enfants par l'intermédiaire d'un système d'inscription.

## Modifications

Nous pouvons mettre à jour cette politique lorsque le produit ou les exigences légales changent. Nous réviserons la date « Dernière mise à jour » lorsque nous le ferons. Continuer à utiliser Kit après une mise à jour signifie que vous avez pris connaissance de la politique révisée.

## Contact

Questions relatives à la confidentialité : [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publié par **Tim G (GitHub : TGthms)**.
