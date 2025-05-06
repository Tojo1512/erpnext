# Migrations de Base de Données dans ERPNext

ERPNext et le framework Frappe utilisent un système sophistiqué pour gérer le schéma de base de données et ses évolutions. Ce document explique comment fonctionnent les migrations et comment elles sont appliquées.

## Principes de Migration dans Frappe

Le système de migration de Frappe suit plusieurs principes :

1. **Déclaratif** : Le schéma est défini par les DocTypes (fichiers JSON)
2. **Versionné** : Les modifications sont suivies par version
3. **Automatique** : Migrations appliquées lors des mises à jour
4. **Idempotent** : Les migrations peuvent être réexécutées sans effet secondaire

## Composants du Système de Migration

Le système de migration comprend plusieurs composants :

### 1. Définitions des DocTypes

Les fichiers JSON définissant les DocTypes servent de "source de vérité" pour le schéma de la base de données. Chaque DocType est automatiquement converti en table SQL.

```json
{
  "doctype": "DocType",
  "name": "Sales Invoice",
  "fields": [
    {
      "fieldname": "customer",
      "fieldtype": "Link",
      "options": "Customer",
      "reqd": 1
    },
    // ... autres champs
  ]
}
```

### 2. Fichiers de Patch

Les patches sont des scripts Python qui contiennent des modifications à appliquer à la base de données. Ils sont stockés dans le dossier `patches/` et référencés dans `patches.txt`.

Structure des dossiers de patches :

```
erpnext/patches/
├── v10_0/                     # Patches pour la version 10.0
├── v11_0/                     # Patches pour la version 11.0
├── v12_0/                     # Patches pour la version 12.0
├── v13_0/                     # Patches pour la version 13.0
├── v14_0/                     # Patches pour la version 14.0
└── v15_0/                     # Patches pour la version 15.0
```

Exemple de fichier de patch :

```python
# erpnext/patches/v15_0/migrate_checkbox_to_select_for_reconciliation_effect.py

import frappe

def execute():
    """
    Migre l'ancien champ de case à cocher vers un nouveau champ de sélection
    pour contrôler les dates de réconciliation des paiements avancés
    """
    companies = frappe.db.get_all("Company", fields=["name", "reconciliation_takes_effect_on"])
    for x in companies:
        new_value = (
            "Advance Payment Date" if x.reconcile_on_advance_payment_date else "Oldest Of Invoice Or Advance"
        )
        frappe.db.set_value("Company", x.name, "reconciliation_takes_effect_on", new_value)

    frappe.db.sql(
        """UPDATE `tabPayment Entry` 
        SET advance_reconciliation_takes_effect_on = 
        IF(reconcile_on_advance_payment_date = 0, 'Oldest Of Invoice Or Advance', 'Advance Payment Date')"""
    )
```

### 3. Fichier patches.txt

Ce fichier liste tous les patches à exécuter dans l'ordre. Lorsqu'un patch est exécuté avec succès, il est marqué comme tel dans la base de données.

Exemple de `patches.txt` :

```
erpnext.patches.v10_0.update_sales_order_status
erpnext.patches.v11_0.renamed_from_to_fields_in_project
erpnext.patches.v14_0.migrate_delivery_stop_lock_field
erpnext.patches.v15_0.migrate_checkbox_to_select_for_reconciliation_effect
```

## Types de Migrations

ERPNext utilise différents types de migrations :

### 1. Création de Table

Lorsqu'un nouveau DocType est créé, une nouvelle table est générée dans la base de données.

```python
def execute():
    # Charger la définition du DocType
    frappe.reload_doc("selling", "doctype", "sales_person_incentive")
```

### 2. Modification de Schéma

Pour les modifications de schéma comme l'ajout ou la suppression de champs.

```python
def execute():
    # Recharger la définition mise à jour
    frappe.reload_doc("accounts", "doctype", "sales_invoice")
    
    # Ajouter une colonne si elle n'existe pas déjà
    if not frappe.db.has_column("Sales Invoice", "new_field"):
        frappe.db.add_column("Sales Invoice", "new_field", "Data")
```

### 3. Renommage de Champs

Pour renommer des champs :

```python
from frappe.model.utils.rename_field import rename_field

def execute():
    if frappe.db.has_column("Delivery Stop", "lock"):
        rename_field("Delivery Stop", "lock", "locked")
```

### 4. Migration de Données

Pour déplacer ou transformer des données :

```python
def execute():
    # Migrer les données d'un ancien champ vers un nouveau
    for invoice in frappe.get_all("Sales Invoice", fields=["name", "old_field"]):
        if invoice.old_field:
            frappe.db.set_value("Sales Invoice", invoice.name, "new_field", invoice.old_field)
```

## Processus de Migration

Le processus de migration se déroule comme suit :

1. **Installation ou mise à jour** : Lorsqu'une application est installée ou mise à jour
2. **Chargement des DocTypes** : Les définitions des DocTypes sont chargées
3. **Comparaison de schéma** : Le schéma actuel est comparé à celui défini par les DocTypes
4. **Exécution des migrations** : Les modifications de schéma sont appliquées
5. **Exécution des patches** : Les patches non exécutés sont appliqués séquentiellement

## Commandes de Migration

Frappe fournit plusieurs commandes pour gérer les migrations :

```bash
# Exécuter toutes les migrations en attente
bench migrate

# Recharger un DocType spécifique
bench reload-doctype "Sales Invoice"

# Exécuter un patch spécifique
bench execute erpnext.patches.v15_0.migrate_checkbox_to_select_for_reconciliation_effect
```

## Suivi des Migrations

Frappe garde une trace des migrations exécutées dans les tables suivantes :

1. **tabInstalled Application** : Liste des applications installées et leurs versions
2. **tabPatch Log** : Journal des patches exécutés

## Bonnes Pratiques

Quelques bonnes pratiques pour les migrations de base de données :

1. **Idempotence** : Les migrations doivent pouvoir être réexécutées sans problème
2. **Atomicité** : Les migrations doivent réussir entièrement ou échouer entièrement
3. **Tests** : Tester les migrations sur une copie de la base de données avant de les appliquer en production
4. **Sauvegardes** : Toujours sauvegarder la base de données avant d'appliquer des migrations

## Exemples de Cas d'Usage

### Exemple 1 : Ajouter un Nouveau Champ

```python
def execute():
    frappe.reload_doc("accounts", "doctype", "sales_invoice")
    
    # Ajouter une valeur par défaut pour les enregistrements existants
    frappe.db.sql("""
        UPDATE `tabSales Invoice` 
        SET new_field = 'Default Value' 
        WHERE new_field IS NULL
    """)
```

### Exemple 2 : Renommer une Table

```python
def execute():
    if frappe.db.table_exists("Old Table Name"):
        frappe.db.rename_table("Old Table Name", "New Table Name")
        
        # Mettre à jour les références dans d'autres tables
        frappe.db.sql("""
            UPDATE `tabSome Other Table` 
            SET reference_doctype = 'New Table Name' 
            WHERE reference_doctype = 'Old Table Name'
        """)
```

### Exemple 3 : Migrer Vers une Nouvelle Structure

```python
def execute():
    # Charger les nouvelles définitions
    frappe.reload_doc("accounts", "doctype", "new_structure")
    
    # Migrer les données de l'ancienne structure vers la nouvelle
    old_records = frappe.db.get_all("Old Structure", fields=["name", "field1", "field2"])
    
    for record in old_records:
        new_doc = frappe.new_doc("New Structure")
        new_doc.old_reference = record.name
        new_doc.new_field1 = record.field1
        new_doc.new_field2 = transform_data(record.field2)
        new_doc.insert()
``` 