# Implémentation de la fonctionnalité de réinitialisation des données dans ERPNext

Ce document décrit la mise en œuvre d'une fonctionnalité de réinitialisation des données dans ERPNext. Cette fonctionnalité permet aux administrateurs système de supprimer toutes les données transactionnelles tout en préservant la configuration du système.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Fonctionnement technique](#fonctionnement-technique)
4. [Interface utilisateur](#interface-utilisateur)
5. [Sécurité](#sécurité)
6. [Installation](#installation)
7. [Dépannage](#dépannage)

## Vue d'ensemble

La fonctionnalité de réinitialisation des données est implémentée sous forme d'application personnalisée Frappe/ERPNext nommée `custom_tools`. Cette application ajoute un bouton "Reset Site Data" dans le menu d'aide de la barre de navigation, qui permet aux administrateurs système de supprimer toutes les données transactionnelles du système tout en préservant les utilisateurs, les paramètres et la structure du système.

## Structure des fichiers

L'application `custom_tools` est structurée comme suit :

```
custom_tools/
├── __init__.py                  # Fichier d'initialisation Python avec version
├── api/
│   ├── __init__.py              # Fichier d'initialisation du module API
│   └── data_reset.py            # Script principal pour la réinitialisation des données
├── config/
│   └── desktop.py               # Configuration de l'icône du bureau
├── public/
│   ├── css/
│   │   └── custom_tools.css     # Styles CSS pour l'application
│   └── js/
│       ├── custom_tools.js      # Script JavaScript principal (avec bouton de réinitialisation)
│       └── data_reset_button.js # Script pour le bouton (non utilisé dans la version finale)
├── hooks.py                     # Hooks Frappe pour l'intégration
├── MANIFEST.in                  # Fichier de manifeste pour l'installation
├── requirements.txt             # Dépendances de l'application
└── setup.py                     # Script d'installation
```

## Fonctionnement technique

### Backend (Python)

Le cœur de la fonctionnalité est implémenté dans `data_reset.py` qui contient deux fonctions principales :

1. **`reset_site_data()`** : Point d'entrée exposé via API Frappe (whitelist)
   - Vérifie les permissions (seuls les System Managers peuvent réinitialiser les données)
   - Exige une confirmation supplémentaire via un paramètre de requête
   - Exécute la tâche en arrière-plan via `enqueue` pour éviter les timeouts

2. **`execute_data_reset()`** : Fonction qui exécute le processus de réinitialisation
   - Parcourt une liste de DocTypes métier organisés par catégories
   - Supprime les données de chaque DocType en utilisant `frappe.db.delete()`
   - Journalise la progression et les erreurs éventuelles
   - Désactive les triggers pendant le processus pour optimiser les performances

Voici la liste des DocTypes supprimés, organisés par catégories fonctionnelles :

```python
doc_types_to_delete = [
    # Ventes & CRM
    "Customer", "Sales Order", "Sales Invoice", "Quotation", "Delivery Note", "Contact", "Address", "Lead", "Opportunity",

    # Achats
    "Supplier", "Purchase Order", "Purchase Invoice", "Request for Quotation", "Supplier Quotation",

    # Stock & Logistique
    "Item", "Stock Entry", "Stock Reconciliation", "Material Request", "Bin", "Stock Ledger Entry", "Warehouse",

    # RH
    "Employee", "Attendance", "Leave Application", "Expense Claim", "Salary Slip", "Payroll Entry", "Job Applicant", "Job Opening",

    # Comptabilité
    "Journal Entry", "Payment Entry", "Account", "GL Entry", "Payment Request", "Bank Reconciliation Statement",

    # Projets
    "Project", "Task", "Timesheet",

    # Fabrication / Production
    "Work Order", "Bill of Materials", "Job Card", "Routing",

    # Actifs immobilisés
    "Asset", "Asset Category", "Asset Movement", "Asset Depreciation", "Asset Maintenance", "Asset Location",

    # Qualité
    "Quality Inspection", "Quality Inspection Template", "Quality Goal",

    # Support / Assistance
    "Issue", "Maintenance Visit", "Maintenance Schedule", "Service Level Agreement",
]
```

### Frontend (JavaScript)

L'interface utilisateur est implémentée dans `custom_tools.js` qui :

1. Ajoute un bouton "Reset Site Data" dans le menu d'aide de la barre de navigation
2. Gère les confirmations utilisateur (double confirmation avec saisie du mot "RESET")
3. Affiche une fenêtre de progression pendant que le processus s'exécute
4. Vérifie périodiquement les logs pour déterminer quand le processus est terminé
5. Affiche un message de succès et recharge la page une fois la réinitialisation terminée

Le script inclut également des mécanismes de sécurité pour éviter les problèmes courants :
- Timeout automatique après 5 minutes pour éviter les fenêtres bloquées
- Suivi du nombre de nouveaux logs pour détecter l'activité du processus
- Gestion de différents scénarios de complétion (succès, timeout)

## Interface utilisateur

1. **Accès à la fonctionnalité** : Un bouton "Reset Site Data" est ajouté dans le menu d'aide (?) de la barre de navigation.

2. **Processus de confirmation** :
   - Première confirmation : une boîte de dialogue demande à l'utilisateur de confirmer l'action
   - Deuxième confirmation : l'utilisateur doit taper "RESET" pour confirmer l'opération irréversible

3. **Retour visuel** :
   - Une boîte de dialogue avec animation de chargement s'affiche pendant le processus
   - Un message de succès apparaît une fois la réinitialisation terminée
   - La page se recharge automatiquement après la réinitialisation

## Sécurité

Plusieurs mesures de sécurité sont mises en place :

1. **Restriction d'accès** : Seuls les utilisateurs ayant le rôle "System Manager" peuvent exécuter la réinitialisation
2. **Double confirmation** : L'utilisateur doit confirmer deux fois, dont une avec saisie du mot "RESET"
3. **Journalisation** : Toutes les étapes du processus sont journalisées pour audit ultérieur
4. **Exécution en arrière-plan** : Le processus s'exécute en tâche de fond pour éviter les problèmes de timeout
5. **Gestion des erreurs** : Les erreurs sont capturées et n'interrompent pas le processus global

## Installation

Pour installer cette fonctionnalité :

1. **Créer la structure de l'application** :
   ```bash
   # Créer les dossiers nécessaires
   mkdir -p custom_tools/api custom_tools/public/js custom_tools/public/css custom_tools/config
   ```

2. **Créer les fichiers de l'application** selon la structure décrite ci-dessus.

3. **Ajouter l'application à la liste des applications** :
   ```bash
   # Depuis le répertoire racine de frappe-bench
   echo "custom_tools" >> sites/apps.txt
   ```

4. **Installer l'application** :
   ```bash
   bench --site [nom-du-site] install-app custom_tools
   bench build
   bench restart
   ```

## Dépannage

Si vous rencontrez des problèmes avec la fonctionnalité de réinitialisation des données, voici quelques points à vérifier :

1. **Le bouton n'apparaît pas** :
   - Vérifiez que l'application est correctement installée (`bench list-apps`)
   - Vérifiez les erreurs JavaScript dans la console du navigateur
   - Assurez-vous que le build a été correctement exécuté

2. **Erreurs lors de la réinitialisation** :
   - Vérifiez les logs d'erreur dans ERPNext (section Error Log)
   - Assurez-vous que l'utilisateur a le rôle "System Manager"
   - Vérifiez les permissions du système de fichiers si le processus échoue

3. **L'interface se bloque** :
   - Le timeout automatique de 5 minutes devrait éviter ce problème
   - Si nécessaire, rafraîchissez manuellement la page
   - Vérifiez les logs pour voir si le processus a bien été lancé 