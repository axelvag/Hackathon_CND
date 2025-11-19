"""
Prompt templates for LLM interactions
"""

ANALYZE_UNKNOWN_EVENT_PROMPT = """Vous êtes un expert en cybersécurité
analysant des événements de logs de pare-feu.

Un log de pare-feu a été classifié avec un type précis : {precise_type}

Votre tâche est de :
1. Définir precise_type à : {precise_type}
2. Fournir un titre court (une phrase) décrivant le problème
3. Fournir une explication approfondie de ce que signifie ce type
   d'événement, incluant :
   - Quel est le problème
   - Dans quel contexte il apparaît typiquement
   - Avec quoi il pourrait être accompagné
   - Quelle pourrait être la situation plus large ou les impacts
4. Fournir des étapes de remédiation actionnables pour résoudre
   ce problème

Utilisez la recherche web pour obtenir des informations à jour sur
ce type d'événement de sécurité si nécessaire.

{context_str}

Fournissez votre analyse dans le format structuré demandé.
IMPORTANT : Incluez precise_type='{precise_type}' dans votre réponse.
Répondez EN FRANÇAIS."""

ENHANCED_ANALYZE_PROMPT = """{base_prompt}

Résultats de recherche récents :
{search_results}

Fournissez votre analyse en vous concentrant sur :
- Une explication claire du problème de sécurité
- Des étapes de remédiation pratiques avec titres et descriptions

Répondez EN FRANÇAIS."""

FALLBACK_EXPLANATION_TEMPLATE = (
    "Événement de sécurité de type {precise_type} détecté. "
    "Une investigation est nécessaire pour comprendre le contexte, "
    "les impacts potentiels et les étapes de remédiation appropriées."
)

DEFAULT_REMEDIATION_STEPS = [
    {
        "title": "Enquêter sur le problème",
        "description": (
            "Examiner les logs du pare-feu et le trafic réseau "
            "pour comprendre la nature de cet événement."
        ),
    },
    {
        "title": "Prendre des mesures préventives",
        "description": (
            "Mettre en œuvre des mesures de sécurité appropriées "
            "basées sur les résultats de l'enquête."
        ),
    },
]
