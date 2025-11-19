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
    {
        "precise_type": "duplicate_fields",
        "title": "Champs dupliqués — peut provoquer ambiguïté de parsing.",
        "explanation": "Des champs dupliqués indiquent qu'une même clé apparaît plusieurs fois dans une ligne de log, créant une ambiguïté lors du parsing. Ce problème apparaît typiquement lors d'erreurs de concaténation, de bugs dans le code de génération de logs, de problèmes de formatage, ou de conflits entre différentes sources de données. Il peut être accompagné d'autres erreurs de format, de valeurs contradictoires, ou de structures de données incorrectes. Dans le contexte opérationnel, cela peut causer des erreurs de parsing, des valeurs incorrectes utilisées pour l'analyse, et des incohérences dans les données. Pour la sécurité, cela peut masquer des informations importantes si le parser utilise la première ou dernière valeur, compromettre l'intégrité des analyses, et créer des confusions lors des investigations. L'impact inclut la perte de données si le parser ignore les duplications, des analyses incorrectes basées sur des valeurs ambiguës, et la nécessité de nettoyer manuellement les données.",
        "remediation": [
            {
                "title": "Dédupliquer les champs",
                "description": "Implémenter une logique de déduplication lors du parsing des logs.",
            },
            {
                "title": "Valider la structure des logs",
                "description": "Vérifier que chaque champ n'apparaît qu'une seule fois dans chaque ligne.",
            },
            {
                "title": "Corriger le générateur de logs",
                "description": "Modifier le système qui génère les logs pour éviter les duplications.",
            },
        ],
    },
    {
        "precise_type": "checksum_error",
        "title": "Erreur de checksum — intégrité des données compromise.",
        "explanation": "Une erreur de checksum indique que l'intégrité des données du paquet réseau a été compromise lors de la transmission. Ce problème apparaît typiquement lors de corruption de données sur le réseau, de problèmes matériels (cartes réseau défectueuses, câbles endommagés), d'interférences électromagnétiques, ou de problèmes de synchronisation. Il peut être accompagné d'autres erreurs réseau, de pertes de paquets, ou de retransmissions. Dans le contexte de sécurité, cela peut indiquer des attaques de manipulation de trafic, des tentatives d'altération de données, ou des problèmes d'intégrité réseau. Cependant, la plupart du temps, cela indique des problèmes d'infrastructure plutôt que des attaques. L'impact opérationnel inclut la perte de données, la nécessité de retransmissions, et la dégradation des performances réseau. Pour la sécurité, cela peut masquer des attaques si les paquets sont corrompus de manière systématique, compromettre l'analyse du trafic, et créer des faux positifs dans les détections.",
        "remediation": [
            {
                "title": "Vérifier l'intégrité des paquets",
                "description": "Valider les checksums lors de la réception des paquets réseau.",
            },
            {
                "title": "Recalculer les checksums",
                "description": "Recalculer et corriger les checksums invalides si possible.",
            },
            {
                "title": "Logger les erreurs de checksum",
                "description": "Enregistrer toutes les erreurs de checksum pour investigation approfondie.",
            },
        ],
    },
    {
        "precise_type": "state_mismatch",
        "title": "Incohérence d'état — la connexion ne correspond pas à l'état attendu.",
        "explanation": "Une incohérence d'état indique que l'état enregistré d'une connexion dans la table d'état du firewall ne correspond pas à l'état réel de la connexion réseau. Ce problème apparaît typiquement lors de timeouts non gérés, de problèmes de synchronisation entre différents composants, de bugs dans la gestion d'état, ou de connexions qui se terminent de manière inattendue. Il peut être accompagné d'autres erreurs de connexion, de timeouts, ou de problèmes de performance. Dans le contexte opérationnel, cela peut causer des blocages incorrects, des connexions qui ne peuvent pas être établies, et des problèmes de performance réseau. Pour la sécurité, cela peut permettre à des connexions suspectes de passer si l'état n'est pas correctement vérifié, compromettre les politiques de sécurité basées sur l'état, et créer des failles dans la protection. L'impact inclut la dégradation des performances, des connexions bloquées incorrectement, et potentiellement des failles de sécurité si les états ne sont pas correctement synchronisés.",
        "remediation": [
            {
                "title": "Synchroniser les états",
                "description": "Vérifier et synchroniser l'état des connexions dans la table d'état du firewall.",
            },
            {
                "title": "Réinitialiser les connexions problématiques",
                "description": "Forcer la fermeture et la réinitialisation des connexions en état incohérent.",
            },
            {
                "title": "Améliorer la gestion d'état",
                "description": "Renforcer la logique de gestion d'état pour éviter les incohérences.",
            },
        ],
    },
    {
        "precise_type": "connection_issue",
        "title": "Problème de connexion — reset ou session expirée.",
        "explanation": "Un problème de connexion indique qu'une session réseau a été interrompue de manière inattendue ou a expiré. Ce problème apparaît typiquement lors de timeouts de session, de resets TCP, de problèmes de réseau, de surcharge du firewall, ou de problèmes de configuration des timeouts. Il peut être accompagné d'autres erreurs de connexion, de problèmes de performance, ou de timeouts multiples. Dans le contexte opérationnel, cela peut causer des interruptions de service, des problèmes de connectivité, et des dégradations de performance. Pour la sécurité, cela peut masquer des attaques si les connexions sont fermées avant d'être analysées, compromettre la détection d'activités suspectes basées sur la durée des connexions, et créer des faux positifs. Cependant, cela peut aussi être normal dans certains contextes (connexions de courte durée, protocoles sans état). L'impact inclut la perte de visibilité sur certaines connexions, la nécessité de gérer les timeouts correctement, et potentiellement des problèmes de disponibilité si les timeouts sont trop courts.",
        "remediation": [
            {
                "title": "Vérifier la configuration des timeouts",
                "description": "S'assurer que les timeouts de session sont correctement configurés.",
            },
            {
                "title": "Analyser les resets de connexion",
                "description": "Investigator les causes des resets de connexion fréquents.",
            },
            {
                "title": "Optimiser la gestion des sessions",
                "description": "Améliorer la gestion du cycle de vie des sessions pour réduire les problèmes.",
            },
        ],
    },
    {
        "precise_type": "data_quality_issue",
        "title": "Problème de qualité des données — erreurs multiples détectées.",
        "explanation": "Un problème de qualité des données indique la présence de multiples erreurs dans les logs, suggérant un problème systémique plutôt qu'une erreur isolée. Ce problème apparaît typiquement lors de problèmes d'infrastructure majeurs, de bugs critiques dans le système de logging, de problèmes de configuration, ou de défaillances matérielles. Il peut être accompagné de nombreux autres types d'erreurs, de logs incomplets, ou de données incohérentes. Dans le contexte opérationnel, cela indique un problème grave qui compromet la fiabilité globale du système de logging. Pour la sécurité, cela peut masquer des attaques importantes si les logs sont trop corrompus pour être analysés, compromettre complètement la capacité de détection, et créer une perte de confiance dans le système. L'impact est critique car cela affecte toutes les analyses de sécurité, empêche la détection d'incidents, et compromet la capacité à répondre aux incidents. Cela nécessite une intervention immédiate pour restaurer la qualité des données.",
        "remediation": [
            {
                "title": "Audit complet des données",
                "description": "Effectuer un audit approfondi pour identifier toutes les sources d'erreurs.",
            },
            {
                "title": "Améliorer la validation",
                "description": "Renforcer les validations à tous les niveaux du pipeline de données.",
            },
            {
                "title": "Mettre en place un monitoring",
                "description": "Implémenter un système de monitoring pour détecter les problèmes de qualité rapidement.",
            },
        ],
    },
    {
        "precise_type": "anomalous_behavior",
        "title": "Comportement anormal — activité suspecte détectée.",
        "explanation": "Un comportement anormal indique une activité qui ne correspond pas aux patterns attendus, mais qui n'est pas clairement identifiée comme une attaque spécifique. Ce problème apparaît typiquement lors de changements légitimes dans le trafic, de nouvelles applications, de configurations modifiées, ou de véritables activités suspectes qui ne correspondent à aucun pattern connu. Il peut être accompagné d'autres anomalies, de patterns de trafic inhabituels, ou d'activités qui sortent de la normale. Dans le contexte de sécurité, cela nécessite une investigation approfondie pour déterminer si c'est une menace réelle ou une fausse alerte. L'impact dépend de la nature réelle de l'anomalie - si c'est une attaque, l'impact peut être significatif, mais si c'est une fausse alerte, cela peut créer de la fatigue d'alerte. Cela peut également indiquer des problèmes de configuration, des changements non documentés, ou des évolutions légitimes du trafic réseau.",
        "remediation": [
            {
                "title": "Analyser le comportement",
                "description": "Examiner en détail le comportement anormal pour comprendre sa nature.",
            },
            {
                "title": "Vérifier les configurations",
                "description": "S'assurer que les configurations du système sont correctes et à jour.",
            },
            {
                "title": "Documenter l'anomalie",
                "description": "Documenter l'anomalie pour référence future et amélioration du système.",
            },
        ],
    },
    # Attack types
    {
        "precise_type": "port_scan",
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
        "precise_type": "xss",
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
        "precise_type": "sql_injection",
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
        "precise_type": "ddos",
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
        "precise_type": "brute_force_ssh",
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
        "precise_type": "malware_download",
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
        "precise_type": "malicious_payload",
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
    {
        "precise_type": "data_exfiltration",
        "title": "Exfiltration de données — transfert suspect de grandes quantités de données.",
        "explanation": "Une exfiltration de données indique qu'une grande quantité de données est transférée vers une destination externe de manière suspecte. Cette activité apparaît typiquement lors de transferts vers des destinations non autorisées, de patterns de transfert anormaux, ou de communications avec des serveurs suspects. Elle peut être accompagnée d'autres activités malveillantes, de tentatives de masquage du trafic, ou d'activités de compromission. Dans le contexte plus large, cela indique souvent qu'une attaque a déjà réussi et que l'attaquant extrait des données volées. Cela peut faire partie d'une compromission persistante, être utilisé pour voler des informations sensibles, ou faire partie d'une opération d'espionnage. L'impact peut être catastrophique car cela peut mener au vol de données sensibles, à la violation de la confidentialité, à des violations de conformité réglementaire, et à des dommages réputationnels majeurs. Les techniques d'exfiltration modernes peuvent être très sophistiquées, utilisant des canaux cachés, de l'encryption, et des techniques de stéganographie. La détection précoce est cruciale pour minimiser les données volées.",
        "remediation": [
            {
                "title": "Bloquer la connexion",
                "description": "Interrompre immédiatement la connexion suspecte d'exfiltration.",
            },
            {
                "title": "Analyser les données transférées",
                "description": "Examiner quelles données ont été transférées et évaluer l'impact.",
            },
            {
                "title": "Renforcer le monitoring",
                "description": "Améliorer le monitoring des transferts de données pour détecter rapidement les exfiltrations.",
            },
        ],
    },
    {
        "precise_type": "protocol_violation_attack",
        "title": "Violation de protocole — attaque exploitant des failles de protocole.",
        "explanation": "Une violation de protocole indique qu'un attaquant exploite des failles ou des comportements non standard d'un protocole réseau pour contourner les défenses ou exploiter des vulnérabilités. Cette activité apparaît typiquement lors d'attaques sophistiquées qui exploitent des implémentations spécifiques de protocoles, des comportements edge-case, ou des failles de conception. Elle peut être accompagnée d'autres activités malveillantes, de tentatives d'exploitation, ou d'activités de reconnaissance avancée. Dans le contexte plus large, cela indique souvent une attaque sophistiquée menée par des acteurs avancés qui comprennent profondément les protocoles réseau. Cela peut faire partie d'une campagne d'attaque ciblée, être utilisé pour contourner les défenses, ou exploiter des vulnérabilités zero-day. L'impact peut être sévère car cela peut permettre de contourner les défenses de sécurité, d'exploiter des vulnérabilités non patchées, ou d'établir des canaux de communication cachés. Les attaques basées sur des violations de protocole peuvent être très difficiles à détecter car elles peuvent sembler légitimes à première vue. La détection nécessite une compréhension approfondie des protocoles et de leurs implémentations.",
        "remediation": [
            {
                "title": "Bloquer l'attaque",
                "description": "Rejeter les paquets qui violent les spécifications du protocole.",
            },
            {
                "title": "Analyser la violation",
                "description": "Examiner en détail comment le protocole est violé pour comprendre l'attaque.",
            },
            {
                "title": "Mettre à jour les règles",
                "description": "Ajouter des règles de firewall spécifiques pour bloquer ce type de violation.",
            },
        ],
    },
    {
        "precise_type": "unknown_attack_pattern",
        "title": "Modèle d'attaque inconnu — activité hautement suspecte détectée.",
        "explanation": "Un modèle d'attaque inconnu indique une activité hautement suspecte qui ne correspond à aucun pattern d'attaque connu. Cette activité apparaît typiquement lors d'attaques nouvelles ou sophistiquées, d'exploitation de vulnérabilités zero-day, ou d'activités malveillantes adaptées spécifiquement pour éviter la détection. Elle peut être accompagnée d'autres activités suspectes, de patterns de trafic anormaux, ou de comportements qui sortent clairement de la normale. Dans le contexte plus large, cela peut indiquer une attaque ciblée sophistiquée, une nouvelle technique d'attaque, ou une exploitation de vulnérabilités non documentées. L'impact peut être significatif car les attaques inconnues peuvent être très difficiles à détecter et à contrer, et peuvent exploiter des vulnérabilités non patchées. Cela nécessite une investigation approfondie pour comprendre la nature de l'attaque et développer des contre-mesures appropriées. La détection de patterns inconnus est cruciale car elle peut permettre d'identifier de nouvelles menaces avant qu'elles ne deviennent courantes.",
        "remediation": [
            {
                "title": "Isoler le système",
                "description": "Isoler le système affecté du reste du réseau pour contenir la menace.",
            },
            {
                "title": "Analyser en profondeur",
                "description": "Effectuer une analyse approfondie pour comprendre la nature de l'attaque.",
            },
            {
                "title": "Documenter pour référence",
                "description": "Documenter tous les détails de l'attaque pour améliorer la détection future.",
            },
        ],
    },
    {
        "precise_type": "suspicious_activity",
        "title": "Activité suspecte — comportement anormal nécessitant investigation.",
        "explanation": "Une activité suspecte indique un comportement anormal qui nécessite une investigation approfondie pour déterminer si c'est une menace réelle ou une fausse alerte. Cette activité apparaît typiquement lors de patterns de trafic inhabituels, de comportements qui sortent de la normale, ou d'activités qui ne correspondent pas aux patterns attendus. Elle peut être accompagnée d'autres anomalies, de patterns de trafic suspects, ou d'activités qui nécessitent une explication. Dans le contexte plus large, cela peut indiquer une attaque en cours qui n'a pas encore été identifiée, des changements légitimes dans le trafic qui nécessitent une documentation, ou des problèmes de configuration. L'impact dépend de la nature réelle de l'activité - si c'est une attaque, l'impact peut être significatif, mais si c'est une fausse alerte, cela peut créer de la fatigue d'alerte. Cela nécessite une investigation pour déterminer la nature réelle de l'activité et prendre les mesures appropriées. La détection d'activités suspectes est importante car elle peut permettre d'identifier des menaces avant qu'elles ne deviennent critiques.",
        "remediation": [
            {
                "title": "Surveiller l'activité",
                "description": "Augmenter le niveau de surveillance pour cette activité suspecte.",
            },
            {
                "title": "Analyser le contexte",
                "description": "Examiner le contexte complet de l'activité pour déterminer si elle est malveillante.",
            },
            {
                "title": "Prendre des mesures préventives",
                "description": "Mettre en place des mesures préventives basées sur les patterns détectés.",
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
