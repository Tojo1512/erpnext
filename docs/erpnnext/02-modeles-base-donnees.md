# Modèles de Base de Données dans ERPNext

ERPNext utilise une approche de modélisation des données basée sur le concept de "DocType" du framework Frappe. Voici comment les données sont structurées et gérées dans l'application.

## Le Concept de DocType

Un DocType (Type de Document) est l'équivalent d'une table dans une base de données relationnelle, mais avec des fonctionnalités supplémentaires. Chaque DocType est défini par :

1. **Fichier JSON** : Définit la structure, les champs, les validations et les permissions
2. **Fichier Python** : Contient la logique métier, les validations et les méthodes personnalisées
3. **Fichier JS** (optionnel) : Gère le comportement client-side du formulaire
4. **Templates HTML** (optionnel) : Pour les affichages personnalisés

## Structure d'un DocType

Chaque DocType est stocké dans un dossier portant son nom (en snake_case) dans le sous-dossier `doctype` du module correspondant. Par exemple, pour la facture de vente :

```
erpnext/
└── accounts/
    └── doctype/
        └── sales_invoice/
            ├── sales_invoice.json      # Définition des champs
            ├── sales_invoice.py        # Contrôleur Python
            ├── sales_invoice.js        # Script client
            └── test_sales_invoice.py   # Tests unitaires
```

## Définition des Champs

La définition d'un DocType dans le fichier JSON comprend :

- Métadonnées (nom, description, autorisations)
- Liste des champs avec leurs types, étiquettes, options
- Relations avec d'autres DocTypes
- Actions et boutons personnalisés
- Règles de validation

Exemple simplifié d'un DocType (extrait du fichier JSON) :

```json
{
  "doctype": "DocType",
  "name": "Sales Invoice",
  "module": "Accounts",
  "fields": [
    {
      "fieldname": "customer",
      "fieldtype": "Link",
      "label": "Customer",
      "options": "Customer",
      "reqd": 1
    },
    {
      "fieldname": "posting_date",
      "fieldtype": "Date",
      "label": "Date",
      "default": "Today"
    }
  ]
}
```

## Types de Champs

Frappe/ERPNext prend en charge de nombreux types de champs, notamment :

- **Data** : Texte simple
- **Link** : Référence à un autre DocType
- **Table** : Relation un-à-plusieurs (sous-table)
- **Select** : Liste déroulante
- **Date**, **Time**, **Datetime** : Champs temporels
- **Currency**, **Float**, **Int** : Champs numériques
- **Text Editor** : Éditeur de texte riche
- **Attach** : Pièce jointe
- **Check** : Case à cocher (booléen)

## Relations Entre DocTypes

Les relations entre DocTypes sont gérées par différents types de champs :

1. **Link** : Relation un-à-un (équivalent à une clé étrangère)
2. **Table** : Relation un-à-plusieurs (table enfant)
3. **Dynamic Link** : Relation polymorphique

## Contrôleurs Python

Chaque DocType peut avoir un contrôleur Python qui étend la classe `Document` de Frappe. Ce contrôleur contient des méthodes de cycle de vie comme :

- `validate()` : Validation avant enregistrement
- `before_save()` : Exécuté avant l'enregistrement
- `on_submit()` : Exécuté lors de la soumission du document
- `on_cancel()` : Exécuté lors de l'annulation

Exemple simplifié d'un contrôleur :

```python
from frappe.model.document import Document

class SalesInvoice(Document):
    def validate(self):
        self.validate_customer()
        self.calculate_totals()
    
    def on_submit(self):
        self.update_inventory()
        self.create_gl_entries()
```

## Migrations de Base de Données

Les modifications de schéma sont gérées par le système de migrations de Frappe :

1. Lorsqu'un nouveau DocType est créé ou modifié, Frappe génère les tables SQL correspondantes
2. Les modifications de schéma sont suivies par des fichiers de patch dans le dossier `patches/`
3. Les migrations sont exécutées automatiquement lors de la mise à jour de l'application

## Requêtes et Opérations sur la Base de Données

ERPNext utilise une API ORM (Object-Relational Mapping) pour interagir avec la base de données :

```python
# Créer un enregistrement
doc = frappe.new_doc("Sales Invoice")
doc.customer = "Client ABC"
doc.insert()

# Lire un enregistrement
doc = frappe.get_doc("Sales Invoice", "INV-00001")

# Mettre à jour un enregistrement
doc.status = "Paid"
doc.save()

# Supprimer un enregistrement
frappe.delete_doc("Sales Invoice", "INV-00001")

# Requête SQL via l'ORM
invoices = frappe.get_all(
    "Sales Invoice",
    filters={"customer": "Client ABC", "status": "Unpaid"},
    fields=["name", "grand_total", "due_date"]
)
``` 