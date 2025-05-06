# Fichiers Métier dans ERPNext

La logique métier dans ERPNext est principalement implémentée dans les contrôleurs Python associés à chaque DocType. Cette documentation explique comment les règles métier sont organisées et implémentées dans le système.

## Organisation de la Logique Métier

La logique métier dans ERPNext est organisée de manière hiérarchique :

1. **Contrôleurs Spécifiques** : Associés à un DocType particulier (ex: `sales_invoice.py`)
2. **Contrôleurs Communs** : Gèrent la logique partagée entre plusieurs DocTypes similaires (ex: `selling_controller.py`)
3. **Fonctions Utilitaires** : Fonctions génériques utilisées par plusieurs modules (ex: `utils.py`)

## Contrôleurs Spécifiques aux DocTypes

Chaque DocType possède généralement un fichier Python portant le même nom qui contient sa logique métier spécifique. Par exemple, pour une facture de vente :

```
erpnext/accounts/doctype/sales_invoice/sales_invoice.py
```

Ce fichier définit une classe qui hérite de `Document` ou d'un contrôleur commun et implémente des méthodes spécifiques à ce DocType.

Exemple simplifié :

```python
class SalesInvoice(SellingController):
    def validate(self):
        super().validate()  # Appelle la validation du parent
        self.validate_delivery_note()
        self.validate_write_off_account()
        self.validate_tax_accounts()
        # Plus de validations spécifiques...
    
    def on_submit(self):
        self.update_stock_ledger()
        self.make_gl_entries()
        self.update_sales_order()
        # Plus d'actions post-soumission...
```

## Contrôleurs Communs

Les contrôleurs communs se trouvent dans le dossier `controllers/` et implémentent la logique partagée entre plusieurs DocTypes similaires :

```
erpnext/controllers/
├── accounts_controller.py      # Logique commune aux transactions comptables
├── buying_controller.py        # Logique commune aux transactions d'achat
├── selling_controller.py       # Logique commune aux transactions de vente
├── stock_controller.py         # Logique commune aux transactions de stock
└── taxes_and_totals.py         # Calculs des taxes et totaux
```

Ces contrôleurs définissent des classes dont héritent les contrôleurs spécifiques aux DocTypes.

Exemple simplifié :

```python
class SellingController(StockController):
    def validate(self):
        super().validate()
        self.validate_selling_price()
        self.validate_max_discount()
        self.validate_selling_rate()
        # Plus de validations communes...
    
    def calculate_taxes_and_totals(self):
        # Logique de calcul des taxes et totaux pour tous les documents de vente
```

## Modules Métier Principaux

Les principaux modules métier dans ERPNext sont :

### 1. Module Accounts (Comptabilité)

Gère toutes les transactions financières, le grand livre général, les comptes, les taxes, etc.

```
erpnext/accounts/
├── doctype/                    # DocTypes liés à la comptabilité
├── report/                     # Rapports financiers
├── general_ledger.py           # Gestion du grand livre
├── party.py                    # Logique liée aux clients/fournisseurs
└── utils.py                    # Fonctions utilitaires pour la comptabilité
```

### 2. Module Selling (Ventes)

Gère les processus de vente, les devis, les commandes clients, etc.

```
erpnext/selling/
├── doctype/                    # DocTypes liés aux ventes
│   ├── customer/               # Clients
│   ├── quotation/              # Devis
│   └── sales_order/            # Commandes clients
├── report/                     # Rapports de vente
└── utils.py                    # Fonctions utilitaires pour les ventes
```

### 3. Module Stock (Inventaire)

Gère l'inventaire, les mouvements de stock, les entrepôts, etc.

```
erpnext/stock/
├── doctype/                    # DocTypes liés au stock
│   ├── delivery_note/          # Bons de livraison
│   ├── item/                   # Articles
│   └── warehouse/              # Entrepôts
├── report/                     # Rapports d'inventaire
├── stock_ledger.py             # Gestion du grand livre de stock
└── utils.py                    # Fonctions utilitaires pour le stock
```

### 4. Module Manufacturing (Production)

Gère les processus de fabrication, les ordres de travail, les nomenclatures, etc.

```
erpnext/manufacturing/
├── doctype/                    # DocTypes liés à la fabrication
│   ├── bom/                    # Nomenclatures (Bill of Materials)
│   ├── work_order/             # Ordres de travail
│   └── production_plan/        # Plans de production
├── report/                     # Rapports de production
└── utils.py                    # Fonctions utilitaires pour la production
```

## Communication Entre Modules

Les modules communiquent entre eux via :

1. **Héritage** : Les contrôleurs héritent de classes parentes
2. **Import** : Les modules importent des fonctions d'autres modules
3. **Événements** : Le système d'événements de Frappe permet de déclencher des actions dans d'autres modules
4. **Hooks** : Les hooks définis dans `hooks.py` permettent d'exécuter du code à des moments spécifiques

## Exemple de Flux de Travail

Un exemple de flux de travail métier impliquant plusieurs modules :

1. **Vente** : Création d'une commande client (`sales_order.py`)
2. **Production** : Création d'un ordre de fabrication basé sur la commande (`work_order.py`)
3. **Stock** : Création d'une demande de matériel pour l'ordre de fabrication (`stock_entry.py`)
4. **Comptabilité** : Enregistrement des écritures comptables pour les mouvements de stock (`general_ledger.py`)

Ce flux implique plusieurs modules qui interagissent entre eux pour accomplir un processus métier complet. 