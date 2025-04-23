# Structure du Projet ERPNext

ERPNext est un système ERP (Enterprise Resource Planning) open source complet. Voici la structure détaillée du projet :

## Structure Racine

- `.github/` : Configuration GitHub et workflows CI/CD
- `erpnext/` : Dossier principal contenant le code source
- `package.json` : Gestion des dépendances Node.js
- `pyproject.toml` : Configuration Python du projet
- `.editorconfig`, `.eslintrc`, `.flake8` : Fichiers de configuration pour le formatage et le linting
- `README.md`, `LICENSE.txt` : Documentation principale et licence

## Core Modules (`/erpnext`)

### Modules Principaux

1. **Finances (`accounts/`)**
   - Gestion de la comptabilité
   - Factures et paiements
   - Rapports financiers

2. **Ventes (`selling/`)**
   - Gestion des ventes
   - Devis et commandes clients
   - Pipeline commercial

3. **Achats (`buying/`)**
   - Gestion des achats
   - Commandes fournisseurs
   - Approvisionnement

4. **Stock (`stock/`)**
   - Gestion des inventaires
   - Mouvements de stock
   - Traçabilité des articles

5. **Production (`manufacturing/`)**
   - Ordres de fabrication
   - Planification de la production
   - Gestion des ressources

6. **CRM (`crm/`)**
   - Gestion de la relation client
   - Opportunités commerciales
   - Campagnes marketing

### Modules Support

- **Projects (`projects/`)** : Gestion de projets
- **Assets (`assets/`)** : Gestion des actifs
- **Quality Management (`quality_management/`)** : Gestion de la qualité
- **Support (`support/`)** : Service client et support
- **Regional (`regional/`)** : Adaptations régionales et localisations

### Infrastructure Technique

- **Controllers (`controllers/`)** : Logique métier centrale
- **Public (`public/`)** : Ressources statiques (JS, CSS, images)
- **Templates (`templates/`)** : Modèles pour le rendu
- **Tests (`tests/`)** : Tests automatisés
- **Patches (`patches/`)** : Scripts de migration et mises à jour
- **Hooks (`hooks.py`)** : Points d'extension et personnalisation

### Autres Composants

- **EDI (`edi/`)** : Échange de données informatisé
- **Portal (`portal/`)** : Portail client
- **Utilities (`utilities/`)** : Outils et fonctions utilitaires
- **www (`www/`)** : Pages web publiques
- **Integrations (`erpnext_integrations/`)** : Intégrations tierces

## Configuration et Personnalisation

Le système peut être configuré et personnalisé via :
- Les hooks dans `hooks.py`
- Les fichiers de configuration dans `config/`
- Les domaines métier dans `domains/`
- Les adaptations régionales dans `regional/`

## Développement

Le projet utilise :
- Python comme langage principal
- Frappe Framework comme framework
- Node.js pour les assets front-end
- MariaDB/MySQL pour la base de données

Les outils de développement incluent :
- ESLint pour le linting JavaScript
- Flake8 pour le linting Python
- Pre-commit hooks pour la qualité du code
- GitHub Actions pour CI/CD
