# Frontend - Dashboard de Cybersécurité

Application web React pour la visualisation et la gestion des logs de sécurité et des menaces détectées par le système de firewall.

## 📋 Table des matières

- [Description](#description)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Développement](#développement)

## 📝 Description

Cette application frontend est un dashboard de cybersécurité qui permet de :
- Visualiser en temps réel les logs de sécurité générés par le système
- Analyser les menaces détectées (attaques et bugs)
- Gérer les alertes de sécurité (résolution, rejet)
- Consulter des statistiques détaillées
- Configurer les notifications téléphoniques
- Basculer entre thème clair et sombre

## 🛠 Technologies utilisées

- **React 18.3** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et serveur de développement
- **React Router** - Navigation et routage
- **Tailwind CSS** - Framework CSS utilitaire
- **Recharts** - Bibliothèque de graphiques
- **Axios** - Client HTTP
- **Lucide React** - Icônes
- **ESLint** - Linter pour la qualité du code

## 📦 Prérequis

- **Node.js** >= 18.x
- **npm** >= 9.x (ou équivalent : yarn, pnpm)

## 🚀 Installation


1. **Installer les dépendances**
   ```bash
   npm install
   ```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du dossier `frontend` avec les variables suivantes (voir `.env.example`):

```env
# Endpoint de l'API OVH AI
VITE_OVH_AI_ENDPOINT_URL=https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1

# Token d'accès OVH AI
VITE_OVH_AI_ACCESS_TOKEN=votre_token_ici

# URL du backend pour l'analyse de logs
VITE_BACKEND_URL=http://localhost:8000

# Endpoint de l'API d'appels téléphoniques (backend)
VITE_CALL_API_ENDPOINT=http://localhost:8000/call
```

> **Note** : Les variables d'environnement doivent être préfixées par `VITE_` pour être accessibles dans le code frontend avec Vite.

## 📜 Scripts disponibles

### Développement
```bash
npm run dev
```
Lance le serveur de développement Vite. L'application sera accessible sur `http://localhost:5173` (ou un autre port si celui-ci est occupé).

### Build de production
```bash
npm run build
```
Génère les fichiers optimisés pour la production dans le dossier `dist/`.

### Prévisualisation du build
```bash
npm run preview
```
Prévisualise le build de production localement avant le déploiement.

### Linting
```bash
npm run lint
```
Vérifie la qualité du code avec ESLint.

### Vérification TypeScript
```bash
npm run typecheck
```
Vérifie les erreurs de typage TypeScript sans générer de fichiers.

