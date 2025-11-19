"""
Known event types with hardcoded explanations and remediations
"""

from typing import List, Dict

# Known event types with explanations and remediations
KNOWN_EVENTS: List[Dict] = [
    # Bug types
    {
        "precise_type": "corrupt_line",
        "title": "Ligne corrompue — impossible à parser correctement.",
        "explanation": "Une ligne corrompue dans les logs de firewall indique que les données ont été altérées ou incomplètes lors de l'écriture ou du transfert. Ce problème apparaît typiquement lors d'interruptions brutales du processus d'écriture, de corruption de fichiers, de problèmes de stockage, ou lors de transferts réseau incomplets. Il peut être accompagné d'autres erreurs de parsing, de timestamps manquants, ou de champs tronqués. Dans le contexte plus large, cela peut indiquer des problèmes systémiques de fiabilité du système de logging, des défaillances matérielles, ou des problèmes de réseau. L'impact peut être significatif car cela empêche l'analyse complète des logs, masque des événements de sécurité importants, et compromet la traçabilité des activités réseau.",
        "remediation": [
            {
                "title": "Vérifier l'intégrité du fichier de logs",
                "description": "Vérifier que le fichier de logs n'est pas corrompu ou incomplet.",
            },
            {
                "title": "Vérifier le processus d'écriture",
                "description": "S'assurer que le processus d'écriture des logs ne s'interrompt pas brutalement.",
            },
            {
                "title": "Parser avec gestion d'erreurs",
                "description": "Implémenter un parser robuste qui gère les lignes corrompues sans interrompre le traitement.",
            },
        ],
    },
    {
        "precise_type": "malformed_timestamp",
        "title": "Timestamp invalide — tri temporel impossible.",
        "explanation": "Un timestamp malformé indique que la valeur temporelle ne respecte pas le format attendu (généralement ISO-8601). Ce problème survient souvent lors de changements de configuration, de mises à jour de systèmes, de problèmes de synchronisation temporelle, ou d'erreurs dans le code de génération de logs. Il peut être accompagné d'autres erreurs de format, de décalages temporels, ou de logs désordonnés. Dans un contexte plus large, cela peut révéler des problèmes de gestion du temps système, de configuration incorrecte des fuseaux horaires, ou de bugs dans le système de logging. L'impact est critique car cela empêche l'analyse temporelle des événements, rend impossible la corrélation temporelle entre différents logs, et compromet la capacité à reconstruire la chronologie d'attaques ou d'incidents.",
        "remediation": [
            {
                "title": "Vérifier le format de timestamp",
                "description": "S'assurer que tous les timestamps suivent le format ISO-8601 attendu.",
            },
            {
                "title": "Valider les timestamps à l'entrée",
                "description": "Ajouter une validation des timestamps lors de la génération des logs.",
            },
            {
                "title": "Corriger les timestamps invalides",
                "description": "Utiliser le timestamp de la ligne précédente valide comme fallback.",
            },
        ],
    },
    {
        "precise_type": "invalid_ip",
        "title": "IP invalide — données corrompues ou erronées.",
        "explanation": "Une adresse IP invalide dans les logs indique que la valeur ne respecte pas le format IPv4 ou IPv6 attendu. Ce problème apparaît typiquement lors de corruption de données, d'erreurs de parsing, de bugs dans le code de génération de logs, ou de problèmes de conversion de formats. Il peut être accompagné d'autres erreurs de format, de ports invalides, ou de protocoles incorrects. Dans le contexte de sécurité, cela peut masquer des attaques réelles si les IPs sont corrompues de manière systématique, empêcher le blocage d'adresses malveillantes, et compromettre l'analyse géographique du trafic. L'impact opérationnel inclut l'impossibilité de tracer l'origine des connexions, de bloquer des IPs spécifiques, et de générer des statistiques précises sur le trafic réseau.",
        "remediation": [
            {
                "title": "Valider les adresses IP",
                "description": "Vérifier que toutes les adresses IP (src_ip, dst_ip) sont valides avant l'écriture.",
            },
            {
                "title": "Vérifier la source des données",
                "description": "S'assurer que le système qui génère les logs fournit des IPs valides.",
            },
            {
                "title": "Nettoyer les données corrompues",
                "description": "Implémenter un nettoyage automatique des IPs invalides avec logging.",
            },
        ],
    },
    {
        "precise_type": "nonnumeric_port",
        "title": "Port non numérique — empêche mapping service/port.",
        "explanation": "Un port non numérique indique que la valeur du port n'est pas un entier valide entre 0 et 65535. Ce problème survient souvent lors d'erreurs de conversion de types, de corruption de données, ou de bugs dans le parsing des logs. Il peut être accompagné d'autres erreurs de format, d'IPs invalides, ou de protocoles incorrects. Dans le contexte opérationnel, cela empêche l'identification des services réseau, le mapping port/service, et l'analyse du trafic par port. Pour la sécurité, cela peut masquer des scans de ports, empêcher la détection de services non autorisés, et compromettre l'analyse des patterns de trafic. L'impact inclut la perte de visibilité sur les services exposés, l'impossibilité de générer des statistiques précises par port, et la difficulté à identifier des activités suspectes basées sur les ports.",
        "remediation": [
            {
                "title": "Valider les ports numériques",
                "description": "S'assurer que tous les ports sont des entiers entre 0 et 65535.",
            },
            {
                "title": "Parser les ports correctement",
                "description": "Vérifier que le parsing des ports ne convertit pas les valeurs en chaînes.",
            },
            {
                "title": "Gérer les ports invalides",
                "description": "Remplacer les ports invalides par une valeur par défaut (ex: 0) avec un flag d'erreur.",
            },
        ],
    },
    {
        "precise_type": "missing_field",
        "title": "Champ manquant — perte d'information contextuelle.",
        "explanation": "Un champ manquant indique qu'une information essentielle n'est pas présente dans la ligne de log. Ce problème apparaît typiquement lors de changements de version du système de logging, de configurations incomplètes, de bugs dans le code de génération, ou de limitations du système source. Il peut être accompagné d'autres champs manquants, de valeurs par défaut incorrectes, ou de formats incomplets. Dans le contexte de sécurité, cela réduit la capacité d'analyse, empêche la corrélation complète des événements, et peut masquer des informations critiques pour l'investigation. L'impact opérationnel inclut la perte de contexte pour l'analyse, l'impossibilité d'effectuer certaines corrélations, et la réduction de la qualité globale des analyses de sécurité. Cela peut également indiquer des problèmes plus profonds dans le système de logging ou des incompatibilités entre versions.",
        "remediation": [
            {
                "title": "Vérifier les champs requis",
                "description": "S'assurer que tous les champs essentiels sont présents avant l'écriture des logs.",
            },
            {
                "title": "Utiliser des valeurs par défaut",
                "description": "Définir des valeurs par défaut pour les champs optionnels manquants.",
            },
            {
                "title": "Améliorer la génération de logs",
                "description": "Modifier le système de génération pour garantir la présence de tous les champs requis.",
            },
        ],
    },
    {
        "precise_type": "negative_bytes",
        "title": "Octets négatifs — incohérence de comptage.",
        "explanation": "Des octets négatifs indiquent une erreur logique dans le comptage ou le calcul des données transférées. Ce problème survient souvent lors d'erreurs de calcul, de débordements numériques, de bugs dans le code de comptage, ou de problèmes de synchronisation entre compteurs. Il peut être accompagné d'autres incohérences numériques, de durées négatives, ou de valeurs aberrantes. Dans le contexte opérationnel, cela compromet l'analyse du trafic réseau, la détection d'anomalies basées sur le volume, et la génération de statistiques précises. Pour la sécurité, cela peut masquer des exfiltrations de données, empêcher la détection de transferts suspects, et compromettre l'analyse des patterns de trafic. L'impact inclut la perte de confiance dans les métriques de trafic, l'impossibilité de détecter des anomalies volumétriques, et la difficulté à générer des rapports précis sur l'utilisation réseau.",
        "remediation": [
            {
                "title": "Valider les valeurs de bytes",
                "description": "S'assurer que le comptage d'octets ne produit jamais de valeurs négatives.",
            },
            {
                "title": "Vérifier les calculs",
                "description": "Auditer les calculs qui génèrent les valeurs de bytes pour identifier la source de l'erreur.",
            },
            {
                "title": "Corriger les valeurs négatives",
                "description": "Remplacer les valeurs négatives par 0 avec un flag d'erreur pour investigation.",
            },
        ],
    },
    # Attack types
    {
        "precise_type": "Port scan",
        "title": "Scan de ports — activité de reconnaissance.",
        "explanation": "Un scan de ports est une activité de reconnaissance où un attaquant teste systématiquement quels ports sont ouverts sur un système cible. Cette activité apparaît typiquement lors de la phase de reconnaissance d'une attaque, avant l'exploitation réelle. Elle peut être accompagnée d'autres activités de reconnaissance comme des scans de vulnérabilités, des tentatives d'énumération, ou des recherches d'informations sur les services. Dans le contexte plus large d'une attaque, cela indique souvent qu'un attaquant prépare une attaque plus ciblée, identifie des services vulnérables, ou cartographie le réseau. L'impact immédiat est limité car c'est généralement une activité de reconnaissance, mais l'impact à long terme peut être significatif si elle mène à une exploitation réussie. Cela peut révéler des services non autorisés, des configurations incorrectes, ou des vulnérabilités. La détection précoce est cruciale car elle permet de bloquer l'attaquant avant qu'il ne passe à l'exploitation.",
        "remediation": [
            {
                "title": "Bloquer l'adresse IP source",
                "description": "Ajouter l'adresse IP source à la liste de blocage du firewall.",
            },
            {
                "title": "Augmenter la surveillance",
                "description": "Surveiller de près cette adresse IP pour détecter d'autres activités suspectes.",
            },
            {
                "title": "Analyser les ports ciblés",
                "description": "Examiner quels ports ont été scannés pour identifier les services potentiellement vulnérables.",
            },
        ],
    },
    {
        "precise_type": "Port scan detected",
        "title": "Scan de ports détecté — activité de reconnaissance confirmée.",
        "explanation": "Un scan de ports détecté indique qu'une activité de reconnaissance systématique a été confirmée par le système de détection. Cette activité apparaît typiquement lors de la phase de reconnaissance d'une attaque, où un attaquant teste systématiquement quels ports sont ouverts sur un système cible. Elle peut être accompagnée d'autres activités de reconnaissance comme des scans de vulnérabilités, des tentatives d'énumération, ou des recherches d'informations sur les services. Dans le contexte plus large d'une attaque, cela indique souvent qu'un attaquant prépare une attaque plus ciblée, identifie des services vulnérables, ou cartographie le réseau. L'impact immédiat est limité car c'est généralement une activité de reconnaissance, mais l'impact à long terme peut être significatif si elle mène à une exploitation réussie. Cela peut révéler des services non autorisés, des configurations incorrectes, ou des vulnérabilités. La détection précoce est cruciale car elle permet de bloquer l'attaquant avant qu'il ne passe à l'exploitation.",
        "remediation": [
            {
                "title": "Bloquer l'adresse IP source",
                "description": "Ajouter l'adresse IP source à la liste de blocage du firewall.",
            },
            {
                "title": "Augmenter la surveillance",
                "description": "Surveiller de près cette adresse IP pour détecter d'autres activités suspectes.",
            },
            {
                "title": "Analyser les ports ciblés",
                "description": "Examiner quels ports ont été scannés pour identifier les services potentiellement vulnérables.",
            },
        ],
    },
    {
        "precise_type": "XSS attempt",
        "title": "Tentative XSS — attaque applicative visant scripts côté client.",
        "explanation": "Une tentative XSS (Cross-Site Scripting) est une attaque où un attaquant injecte du code JavaScript malveillant dans une application web, qui est ensuite exécuté dans le navigateur d'autres utilisateurs. Cette attaque apparaît typiquement lors d'interactions avec des applications web vulnérables, souvent via des formulaires, des paramètres URL, ou des champs de saisie utilisateur. Elle peut être accompagnée d'autres attaques applicatives, de tentatives d'injection, ou d'activités de reconnaissance web. Dans le contexte plus large, cela indique que l'application web a des vulnérabilités critiques qui permettent l'injection de code, et que l'attaquant cherche à voler des sessions, des cookies, ou à compromettre les utilisateurs. L'impact peut être sévère car cela peut mener au vol d'identifiants, à la compromission de comptes utilisateurs, à la redirection vers des sites malveillants, ou à l'exécution d'actions non autorisées au nom des utilisateurs. Cela nécessite une réponse immédiate car l'application est vulnérable et d'autres attaquants pourraient exploiter la même faille.",
        "remediation": [
            {
                "title": "Bloquer la requête malveillante",
                "description": "Rejeter immédiatement la requête contenant le payload XSS.",
            },
            {
                "title": "Sanitizer les entrées utilisateur",
                "description": "Implémenter une sanitization stricte de toutes les entrées utilisateur dans l'application.",
            },
            {
                "title": "Configurer les headers de sécurité",
                "description": "Ajouter des Content-Security-Policy headers pour prévenir les attaques XSS.",
            },
        ],
    },
    {
        "precise_type": "SQL Injection",
        "title": "Tentative d'injection SQL — attaque applicative critique.",
        "explanation": "Une tentative d'injection SQL est une attaque critique où un attaquant injecte du code SQL malveillant dans une application web pour manipuler les requêtes à la base de données. Cette attaque apparaît typiquement lors d'interactions avec des applications web qui construisent des requêtes SQL à partir d'entrées utilisateur non validées. Elle peut être accompagnée d'autres tentatives d'injection, d'activités de reconnaissance de base de données, ou d'essais d'exploitation. Dans le contexte plus large, cela indique une vulnérabilité critique dans l'application qui pourrait permettre l'accès non autorisé aux données, la modification ou suppression de données, ou même la prise de contrôle du serveur de base de données. L'impact peut être catastrophique car cela peut mener à la compromission complète de la base de données, au vol de données sensibles, à la corruption de données, ou à l'escalade de privilèges. C'est l'une des vulnérabilités les plus critiques et nécessite une réponse immédiate. La détection précoce est essentielle car une exploitation réussie peut avoir des conséquences désastreuses pour l'organisation.",
        "remediation": [
            {
                "title": "Bloquer la requête immédiatement",
                "description": "Rejeter la requête SQL malveillante et bloquer l'adresse IP source.",
            },
            {
                "title": "Utiliser des requêtes paramétrées",
                "description": "Migrer toutes les requêtes SQL vers des requêtes paramétrées pour prévenir les injections.",
            },
            {
                "title": "Auditer la base de données",
                "description": "Vérifier qu'aucune donnée n'a été compromise et examiner les logs de la base de données.",
            },
        ],
    },
    {
        "precise_type": "Potential DDoS - high rate",
        "title": "Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant.",
        "explanation": "Un DDoS (Distributed Denial of Service) est une attaque où de multiples systèmes attaquent simultanément une cible pour la rendre indisponible. Cette attaque apparaît typiquement lors de pics de trafic anormaux, de patterns de requêtes répétitives, ou de trafic provenant de nombreuses sources différentes. Elle peut être accompagnée d'autres activités malveillantes, de tentatives d'exploitation pendant la panne, ou de chantage. Dans le contexte plus large, cela peut faire partie d'une campagne d'attaque plus large, être utilisé comme diversion pour d'autres attaques, ou être motivé par des raisons politiques, financières, ou de chantage. L'impact peut être sévère car cela peut rendre les services complètement indisponibles, causer des pertes financières significatives, endommager la réputation, et créer des opportunités pour d'autres attaques pendant la panne. Les attaques DDoS modernes peuvent être très sophistiquées, utilisant des botnets massifs, et peuvent être difficiles à distinguer du trafic légitime. La détection précoce et la mitigation rapide sont cruciales pour minimiser l'impact.",
        "remediation": [
            {
                "title": "Activer la protection DDoS",
                "description": "Activer les mécanismes de protection DDoS au niveau du firewall et du réseau.",
            },
            {
                "title": "Limiter le débit",
                "description": "Implémenter des limites de débit (rate limiting) pour les connexions suspectes.",
            },
            {
                "title": "Contacter le fournisseur",
                "description": "Alerter le fournisseur d'accès pour qu'il puisse bloquer le trafic à la source.",
            },
        ],
    },
    {
        "precise_type": "DDoS pattern",
        "title": "Modèle DDoS détecté — schéma d'attaque distribué identifié.",
        "explanation": "Un modèle DDoS (Distributed Denial of Service) indique qu'un schéma d'attaque distribué a été identifié dans le trafic réseau. Cette attaque apparaît typiquement lors de patterns de trafic répétitifs provenant de multiples sources, de pics de trafic coordonnés, ou de schémas de requêtes malveillants. Elle peut être accompagnée d'autres activités malveillantes, de tentatives d'exploitation pendant la panne, ou de chantage. Dans le contexte plus large, cela peut faire partie d'une campagne d'attaque plus large, être utilisé comme diversion pour d'autres attaques, ou être motivé par des raisons politiques, financières, ou de chantage. L'impact peut être sévère car cela peut rendre les services complètement indisponibles, causer des pertes financières significatives, endommager la réputation, et créer des opportunités pour d'autres attaques pendant la panne. Les attaques DDoS modernes peuvent être très sophistiquées, utilisant des botnets massifs, et peuvent être difficiles à distinguer du trafic légitime. La détection précoce et la mitigation rapide sont cruciales pour minimiser l'impact.",
        "remediation": [
            {
                "title": "Activer la protection DDoS",
                "description": "Activer les mécanismes de protection DDoS au niveau du firewall et du réseau.",
            },
            {
                "title": "Limiter le débit",
                "description": "Implémenter des limites de débit (rate limiting) pour les connexions suspectes.",
            },
            {
                "title": "Contacter le fournisseur",
                "description": "Alerter le fournisseur d'accès pour qu'il puisse bloquer le trafic à la source.",
            },
        ],
    },
    {
        "precise_type": "SSH brute force",
        "title": "Brute-force SSH — tentative de compromission de comptes.",
        "explanation": "Une attaque brute-force SSH est une tentative automatisée de deviner des mots de passe en essayant de nombreuses combinaisons. Cette attaque apparaît typiquement lors de tentatives répétées de connexion avec différents identifiants, souvent depuis des adresses IP suspectes ou des botnets. Elle peut être accompagnée d'autres tentatives d'accès non autorisé, de scans de ports, ou d'activités de reconnaissance. Dans le contexte plus large, cela indique qu'un attaquant cherche à obtenir un accès non autorisé au système, probablement pour établir un point d'entrée pour d'autres attaques, voler des données, ou utiliser le système comme relais. L'impact peut être sévère si l'attaque réussit, car cela peut mener à la compromission complète du système, au vol de données, à l'installation de backdoors, ou à l'utilisation du système pour d'autres attaques. Même si l'attaque échoue, elle consomme des ressources et peut indiquer d'autres vulnérabilités. La détection précoce est importante car les attaquants peuvent utiliser des techniques sophistiquées pour éviter la détection, comme la distribution des tentatives sur de longues périodes.",
        "remediation": [
            {
                "title": "Bloquer l'adresse IP source",
                "description": "Ajouter l'IP source à la liste de blocage après plusieurs tentatives échouées.",
            },
            {
                "title": "Renforcer l'authentification SSH",
                "description": "Désactiver l'authentification par mot de passe et utiliser uniquement les clés SSH.",
            },
            {
                "title": "Changer les ports par défaut",
                "description": "Modifier le port SSH par défaut (22) pour réduire la surface d'attaque.",
            },
        ],
    },
    {
        "precise_type": "Known malicious domain contacted",
        "title": "Contact avec domaine malveillant — communication avec source connue comme malveillante.",
        "explanation": "Un contact avec un domaine connu comme malveillant indique qu'une communication réseau a été établie avec une source identifiée comme malveillante dans les bases de données de renseignement sur les menaces. Cette activité apparaît typiquement lors de tentatives d'exfiltration de données, de communications avec des serveurs de commande et contrôle, de téléchargements de malwares, ou d'autres activités malveillantes. Elle peut être accompagnée d'autres activités malveillantes, de tentatives d'exploitation, ou de communications suspectes. Dans le contexte plus large, cela indique souvent qu'une attaque est en cours ou qu'un système a déjà été compromis. L'impact peut être sévère car cela peut mener à la compromission complète du système, au vol de données, à l'installation de malwares, ou à l'utilisation du système pour d'autres attaques. Les domaines malveillants sont souvent utilisés pour établir des canaux de communication persistants, exfiltrer des données, ou télécharger des charges utiles malveillantes. La détection précoce est cruciale car cela peut permettre de bloquer la communication avant qu'elle ne cause des dommages significatifs.",
        "remediation": [
            {
                "title": "Bloquer le domaine immédiatement",
                "description": "Ajouter le domaine à la liste de blocage du firewall et du DNS.",
            },
            {
                "title": "Isoler le système affecté",
                "description": "Isoler le système qui a contacté le domaine malveillant du reste du réseau.",
            },
            {
                "title": "Analyser la communication",
                "description": "Examiner les logs pour comprendre la nature de la communication et évaluer l'impact.",
            },
        ],
    },
    {
        "precise_type": "Multiple auth failures",
        "title": "Multiples échecs d'authentification — tentative d'accès non autorisé.",
        "explanation": "Des multiples échecs d'authentification indiquent qu'un attaquant tente d'obtenir un accès non autorisé en devinant des identifiants. Cette activité apparaît typiquement lors de tentatives répétées de connexion avec différents identifiants, souvent depuis des adresses IP suspectes ou des botnets. Elle peut être accompagnée d'autres tentatives d'accès non autorisé, de scans de ports, ou d'activités de reconnaissance. Dans le contexte plus large, cela indique qu'un attaquant cherche à obtenir un accès non autorisé au système, probablement pour établir un point d'entrée pour d'autres attaques, voler des données, ou utiliser le système comme relais. L'impact peut être sévère si l'attaque réussit, car cela peut mener à la compromission complète du système, au vol de données, à l'installation de backdoors, ou à l'utilisation du système pour d'autres attaques. Même si l'attaque échoue, elle consomme des ressources et peut indiquer d'autres vulnérabilités. La détection précoce est importante car les attaquants peuvent utiliser des techniques sophistiquées pour éviter la détection, comme la distribution des tentatives sur de longues périodes.",
        "remediation": [
            {
                "title": "Bloquer l'adresse IP source",
                "description": "Ajouter l'IP source à la liste de blocage après plusieurs tentatives échouées.",
            },
            {
                "title": "Renforcer l'authentification",
                "description": "Implémenter des mécanismes d'authentification renforcés comme l'authentification à deux facteurs.",
            },
            {
                "title": "Mettre en place un verrouillage de compte",
                "description": "Implémenter un verrouillage temporaire des comptes après plusieurs tentatives échouées.",
            },
        ],
    },
    {
        "precise_type": "Malware download",
        "title": "Téléchargement malveillant — risque d'infection.",
        "explanation": "Un téléchargement malveillant indique qu'un fichier suspect ou connu comme malveillant a été téléchargé depuis le réseau. Cette activité apparaît typiquement lors de téléchargements depuis des sources non fiables, de clics sur des liens malveillants, ou d'infections par d'autres vecteurs. Elle peut être accompagnée d'autres activités malveillantes, de communications avec des serveurs de commande et contrôle, ou de tentatives d'exécution. Dans le contexte plus large, cela peut faire partie d'une campagne d'attaque plus large, être utilisé pour établir un point d'entrée persistant, ou faire partie d'un ransomware ou d'un botnet. L'impact peut être sévère car cela peut mener à la compromission complète du système, au vol de données, à l'encryption de fichiers (ransomware), ou à l'utilisation du système pour d'autres attaques. Les malwares modernes peuvent être très sophistiqués, utilisant des techniques d'évasion avancées, et peuvent être difficiles à détecter et à éliminer. La détection précoce est cruciale pour minimiser les dommages et empêcher la propagation.",
        "remediation": [
            {
                "title": "Bloquer le téléchargement",
                "description": "Bloquer immédiatement le téléchargement et isoler le système cible.",
            },
            {
                "title": "Analyser le fichier",
                "description": "Soumettre le fichier à une analyse antivirus approfondie.",
            },
            {
                "title": "Vérifier les systèmes affectés",
                "description": "Scanner tous les systèmes qui ont pu être en contact avec le fichier malveillant.",
            },
        ],
    },
    {
        "precise_type": "Suspicious SQL payload",
        "title": "Charge utile malveillante détectée — contenu suspect dans le trafic.",
        "explanation": "Une charge utile malveillante indique que du contenu suspect ou connu comme malveillant a été détecté dans le trafic réseau. Cette activité apparaît typiquement lors de tentatives d'exploitation, d'injections de code, ou de transferts de données malveillantes. Elle peut être accompagnée d'autres activités malveillantes, de tentatives d'exploitation, ou de communications suspectes. Dans le contexte plus large, cela peut faire partie d'une attaque active en cours, être utilisé pour exploiter des vulnérabilités, ou faire partie d'une campagne d'attaque plus large. L'impact dépend de la nature de la charge utile et de si l'exploitation réussit, mais peut être sévère car cela peut mener à la compromission du système, à l'exécution de code arbitraire, ou à l'escalade de privilèges. Les charges utiles modernes peuvent être très sophistiquées, utilisant des techniques d'obfuscation, et peuvent être adaptées spécifiquement pour éviter la détection. La détection précoce est cruciale car cela peut permettre de bloquer l'attaque avant qu'elle ne réussisse.",
        "remediation": [
            {
                "title": "Bloquer le trafic",
                "description": "Rejeter immédiatement le paquet contenant la charge utile malveillante.",
            },
            {
                "title": "Analyser la charge utile",
                "description": "Examiner en détail la charge utile pour comprendre son objectif et sa méthode.",
            },
            {
                "title": "Mettre à jour les signatures",
                "description": "Ajouter cette signature à la base de données de détection pour prévenir de futures attaques.",
            },
        ],
    },
]


def get_known_event(precise_type: str) -> Dict | None:
    """Get known event by precise_type, returns None if not found"""
    for event in KNOWN_EVENTS:
        if event["precise_type"] == precise_type:
            return event
    return None
