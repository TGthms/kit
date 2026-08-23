# Politique de confidentialité

**Dernière mise à jour :** 15 juillet 2026

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

Kit est généralement hébergé sous forme de fichiers statiques (par exemple sur GitHub Pages). Lorsque votre navigateur demande des pages et des ressources, l'hébergeur peut enregistrer des données techniques standard telles que l'adresse IP, l'agent utilisateur, les horodatages et les URL demandées. Ces journaux sont régis par l'infrastructure et les politiques de l'hébergeur, et non par un serveur Kit qui ouvre vos documents.

### 3. Ressources tierces facultatives

Certaines fonctions avancées peuvent charger des bibliothèques de traitement (par exemple des cœurs FFmpeg WebAssembly ou des scripts worker pour PDF) depuis des réseaux de diffusion de contenu la première fois que vous les utilisez. Ces requêtes peuvent transmettre des métadonnées réseau standard au CDN. Le contenu de vos fichiers reste traité dans le navigateur ; le CDN fournit du code, pas vos documents.

## Application web progressive (PWA)

Si vous installez Kit ou autorisez l'utilisation hors ligne, un service worker peut mettre en cache **le shell de l'application** (pages, scripts, styles, icônes). Kit n'est pas conçu pour stocker vos fichiers personnels dans ce cache.

## Enfants

Kit est un utilitaire généraliste. Il ne s'adresse pas aux enfants de moins de 13 ans et, comme Kit ne propose pas de comptes, nous ne recueillons pas sciemment les informations personnelles d'enfants par l'intermédiaire d'un système d'inscription.

## Modifications

Nous pouvons mettre à jour cette politique lorsque le produit ou les exigences légales changent. Nous réviserons la date « Dernière mise à jour » lorsque nous le ferons. Continuer à utiliser Kit après une mise à jour signifie que vous avez pris connaissance de la politique révisée.

## Contact

Questions relatives à la confidentialité : [À propos de moi](https://t-g.pages.dev).

Publié par **Tim G (GitHub : TGthms)**.
