# 🛡️ Système d'Analyse de Logs de Firewall - Hackathon CND


# Comment lancer le projet ?

### LE SITE HÉBERGÉ:
https://edr-42-lyon-cnd.netlify.app/

OU

TERMINAL 1
```bash
cd frontend/
npm install
npm install axios
npm run dev
```

TERMINAL 2
```bash
cd backend/
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
python3 main.py
```

OUVRIR SUR INTERNET
```bash
https://localhost:5173
```

#### Info

Système complet d'analyse et de visualisation des logs de firewall pour la détection d'attaques et de bugs dans les infrastructures réseau. Le projet combine l'intelligence artificielle (modèles ML et LLM) avec une interface web moderne pour offrir une solution de cybersécurité complète.

## 📝 Description

Ce projet est un système de cybersécurité développé dans le cadre d'un hackathon CND (Cyberdéfense) qui permet de :

- **Analyser automatiquement** les logs de firewall pour détecter les menaces
- **Classifier les événements** en attaques ou bugs avec différents niveaux de sévérité
- **Expliquer les menaces** détectées avec des recommandations de remédiation
- **Visualiser en temps réel** les logs et statistiques via un dashboard web
- **Notifier par téléphone** les administrateurs en cas d'alertes critiques
- **Gérer les alertes** (résolution, rejet, commentaires)

## 🏗️ Architecture

Le projet est organisé en deux composants principaux :

```
Hackaton_CND/
├── backend/          # API FastAPI avec workflow LangGraph
├── frontend/         # Application React/TypeScript
```

## Aperçu
- [Page d'accueil](./images/accueil.png)
- [Logs simplifiés](./images/logs.png)
- [Logs mode expert](./images/logs2.png)
- [Nouveau pare-feu](./images/parefeu2.png)


## 🛠️ Technologies utilisées

### Detection
- **Python 3.9+**
- **Scikit-learn** - Bibliothèque d'outils de Machine Learning
- **lightgbm** - Bibliothèque d'outils de Machine Learning
### Backend
- **Python 3.9+**
- **FastAPI** - Framework web moderne et rapide
- **LangGraph** - Workflow d'orchestration pour LLM
- **LangChain** - Framework pour applications LLM
- **OVH AI** - API LLM (DeepSeek R1 Distill Llama 70B)
- **Pydantic** - Validation de données
- **Pandas** - Manipulation de données
- **Vonage** - API d'appels téléphoniques
- **Uvicorn** - Serveur ASGI

### Frontend
- **React 18.3** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et serveur de développement
- **React Router** - Navigation
- **Tailwind CSS** - Framework CSS utilitaire
- **Recharts** - Graphiques et visualisations
- **Axios** - Client HTTP
- **Lucide React** - Icônes

## 📦 Prérequis / Installation / Lancement

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
