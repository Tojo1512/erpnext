# Structure Générale du Projet ERPNext

ERPNext est un système ERP (Enterprise Resource Planning) open-source basé sur le framework Frappe. Ce document présente la structure générale du projet, l'organisation des dossiers et comment les différentes parties communiquent entre elles.

## Organisation des Dossiers

La structure principale du projet ERPNext est organisée comme suit :

```
erpnext/
├── accounts/        # Module de comptabilité et finances
├── assets/          # Gestion des actifs
├── buying/          # Module d'achats
├── commands/        # Commandes CLI
├── config/          # Fichiers de configuration
├── controllers/     # Contrôleurs partagés
├── crm/             # Gestion de la relation client
├── domains/         # Configurations spécifiques à un domaine
├── edi/             # Échange de données informatisées
├── hooks.py         # Points d'extension du framework Frappe
├── manufacturing/   # Module de production
├── patches/         # Mises à jour et migrations de base de données
├── portal/          # Interface utilisateur du portail web
├── public/          # Fichiers statiques (JS, CSS, images)
├── regional/        # Fonctionnalités spécifiques aux régions
├── selling/         # Module de vente
├── setup/           # Configuration initiale
├── stock/           # Gestion des stocks
├── templates/       # Templates HTML
├── utilities/       # Utilitaires partagés
├── www/             # Pages web publiques
└── __init__.py      # Fichier d'initialisation Python
```

## Architecture Logicielle

ERPNext suit une architecture MVC (Modèle-Vue-Contrôleur) basée sur le framework Frappe :

1. **Modèle** : Les modèles de données sont définis sous forme de "DocTypes" dans les sous-dossiers `doctype` de chaque module.
2. **Vue** : Les vues sont gérées par des templates Jinja2 dans le dossier `templates` et via les interfaces utilisateur JavaScript dans `public/js`.
3. **Contrôleur** : La logique métier est implémentée dans les fichiers Python associés à chaque DocType.

## Modules Principaux

ERPNext est divisé en plusieurs modules fonctionnels :

- **Accounts** : Gestion de la comptabilité, des factures, des paiements
- **Selling** : Gestion des ventes, des clients, des devis
- **Buying** : Gestion des achats, des fournisseurs, des bons de commande
- **Stock** : Gestion des stocks, des entrepôts, des mouvements d'inventaire
- **Manufacturing** : Gestion de la production, des ordres de fabrication
- **CRM** : Gestion de la relation client, des prospects, des opportunités
- **Projects** : Gestion de projets
- **HR** : Gestion des ressources humaines
- **Assets** : Gestion des actifs et immobilisations

Chaque module peut être considéré comme une application autonome avec ses propres modèles de données, logique métier et interfaces utilisateur, tout en s'intégrant dans le système global. 