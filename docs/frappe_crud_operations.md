# Guide des Opérations CRUD avec Frappe Framework

Ce guide détaille comment effectuer les opérations CRUD (Create, Read, Update, Delete) dans le framework Frappe utilisé par ERPNext.

## Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Création (Create)](#création-create)
4. [Lecture (Read)](#lecture-read)
5. [Mise à jour (Update)](#mise-à-jour-update)
6. [Suppression (Delete)](#suppression-delete)
7. [Exemples Pratiques](#exemples-pratiques)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [Méthodes d'API REST Personnalisées](#méthodes-d-api-rest-personnalisées)

## Introduction

Frappe est un framework web full-stack en Python qui sert de base à ERPNext. Il utilise un modèle de données basé sur des DocTypes (types de documents) qui représentent les entités métier.

## Prérequis

- Installation de Frappe/ERPNext fonctionnelle
- Connaissances de base en Python
- Compréhension des concepts de Frappe (DocTypes, controllers, etc.)

## Création (Create)

### 1. Création via l'API Python

```python
# Créer un nouveau document
doc = frappe.new_doc("Customer")
doc.customer_name = "Nouveau Client"
doc.customer_type = "Company"
doc.customer_group = "Commercial"
doc.territory = "France"
doc.save()

# Confirmer la transaction
frappe.db.commit()
```

### 2. Création via l'API REST

```
POST /api/resource/Customer

{
  "customer_name": "Nouveau Client",
  "customer_type": "Company",
  "customer_group": "Commercial",
  "territory": "France"
}
```

### 3. Insertion Directe en Base de Données

```python
# Méthode d'insertion directe
frappe.db.insert({
    "doctype": "Customer",
    "customer_name": "Nouveau Client",
    "customer_type": "Company",
    "customer_group": "Commercial",
    "territory": "France"
})

# Confirmer la transaction
frappe.db.commit()
```

## Lecture (Read)

### 1. Récupération d'un Document Unique

```python
# Par nom (ID primaire)
customer = frappe.get_doc("Customer", "CUST-00001")

# Avec filtres
customer = frappe.get_doc("Customer", {"customer_name": "Nouveau Client"})

# Afficher des informations
print(customer.customer_name)
print(customer.as_dict())
```

### 2. Récupération de Plusieurs Documents

```python
# Liste de tous les clients
customers = frappe.get_all("Customer")

# Liste avec filtres
customers = frappe.get_all(
    "Customer",
    filters={"customer_group": "Commercial"},
    fields=["name", "customer_name", "territory"]
)

# Liste avec filtres avancés
customers = frappe.get_list(
    "Customer",
    filters=[
        ["Customer", "customer_group", "=", "Commercial"],
        ["Customer", "territory", "=", "France"]
    ],
    fields=["name", "customer_name", "credit_limit"],
    order_by="customer_name asc",
    limit=10
)
```

### 3. Requêtes SQL Directes

```python
# Exécution d'une requête SQL
customers = frappe.db.sql("""
    SELECT name, customer_name, territory
    FROM `tabCustomer`
    WHERE customer_group = 'Commercial'
    ORDER BY creation DESC
    LIMIT 10
""", as_dict=True)
```

### 4. Via l'API REST

```
GET /api/resource/Customer/CUST-00001
GET /api/resource/Customer?filters=[["customer_group","=","Commercial"]]
```

## Mise à jour (Update)

### 1. Mise à jour via l'API Python

```python
# Charger un document existant
doc = frappe.get_doc("Customer", "CUST-00001")

# Modifier les valeurs
doc.customer_name = "Client Mis à Jour"
doc.credit_limit = 50000
doc.save()

# Confirmer la transaction
frappe.db.commit()
```

### 2. Mise à jour Partielle

```python
# Mise à jour de champs spécifiques
frappe.db.set_value("Customer", "CUST-00001", "customer_name", "Client Mis à Jour")

# Mise à jour de plusieurs champs
frappe.db.set_value("Customer", "CUST-00001", {
    "customer_name": "Client Mis à Jour",
    "credit_limit": 50000
})
```

### 3. Via l'API REST

```
PUT /api/resource/Customer/CUST-00001

{
  "customer_name": "Client Mis à Jour",
  "credit_limit": 50000
}
```

## Suppression (Delete)

### 1. Suppression via l'API Python

```python
# Méthode 1: Charger puis supprimer
doc = frappe.get_doc("Customer", "CUST-00001")
doc.delete()

# Méthode 2: Suppression directe
frappe.delete_doc("Customer", "CUST-00001")

# Confirmer la transaction
frappe.db.commit()
```

### 2. Via l'API REST

```
DELETE /api/resource/Customer/CUST-00001
```

## Exemples Pratiques

### Création d'une Facture Client

```python
def create_sales_invoice():
    # Créer l'entête de facture
    invoice = frappe.new_doc("Sales Invoice")
    invoice.customer = "CUST-00001"
    invoice.posting_date = frappe.utils.today()
    invoice.due_date = frappe.utils.add_days(frappe.utils.today(), 30)
    
    # Ajouter les articles
    invoice.append("items", {
        "item_code": "ITEM-00001",
        "qty": 2,
        "rate": 100
    })
    
    invoice.append("items", {
        "item_code": "ITEM-00002",
        "qty": 1,
        "rate": 200
    })
    
    # Calculer les totaux et enregistrer
    invoice.save()
    
    # Soumettre la facture (optionnel)
    invoice.submit()
    
    return invoice.name
```

### Recherche avec Pagination

```python
def get_paginated_customers(start=0, page_length=20, filters=None):
    return frappe.get_list(
        "Customer",
        filters=filters or {},
        fields=["name", "customer_name", "customer_group", "territory"],
        start=start,
        page_length=page_length,
        order_by="customer_name asc"
    )
```

## Bonnes Pratiques

1. **Transactions**: Utilisez `frappe.db.commit()` avec précaution, généralement à la fin d'un processus complet.

2. **Gestion des Erreurs**: Utilisez try/except pour capturer les erreurs et les gérer proprement.
   ```python
   try:
       doc = frappe.get_doc("Customer", "CUST-00001")
       doc.customer_name = "Nouveau Nom"
       doc.save()
       frappe.db.commit()
   except Exception as e:
       frappe.db.rollback()
       frappe.log_error(f"Erreur lors de la mise à jour: {str(e)}")
   ```

3. **Validation**: Utilisez les hooks de validation de Frappe pour la validation des données.
   ```python
   def validate(self):
       if self.credit_limit < 0:
           frappe.throw("La limite de crédit ne peut pas être négative")
   ```

4. **Permissions**: Respectez le système de permissions de Frappe.
   ```python
   if not frappe.has_permission("Customer", "write"):
       frappe.throw("Permissions insuffisantes", frappe.PermissionError)
   ```

5. **Auditabilité**: Utilisez `add_comment` pour tracer les opérations importantes.
   ```python
   doc.add_comment("Info", "Mise à jour manuelle de la limite de crédit")
   ```

6. **Performance**: Utilisez les requêtes optimisées et évitez les boucles inutiles.
   ```python
   # Optimisé
   customers = frappe.get_all("Customer", filters={"territory": "France"}, fields=["name"])
   
   # À éviter (N+1 requêtes)
   customers = frappe.get_all("Customer")
   for c in customers:
       doc = frappe.get_doc("Customer", c.name)
       if doc.territory == "France":
           # Traitement
   ```

## Méthodes d'API REST Personnalisées

Frappe permet de créer des API REST personnalisées via le point d'entrée `/api/method/`.

### 1. Création d'une Méthode d'API

```python
# Dans un fichier Python (ex: my_custom_app/api.py)
import frappe
from frappe import _
from frappe.utils import nowdate

@frappe.whitelist()
def get_customer_info(customer_id=None):
    """Récupère les informations d'un client avec ses dernières commandes"""
    if not customer_id:
        frappe.throw(_("ID client requis"))
        
    customer = frappe.get_doc("Customer", customer_id)
    
    # Récupérer les dernières commandes
    orders = frappe.get_all(
        "Sales Order",
        filters={"customer": customer_id, "docstatus": 1},
        fields=["name", "transaction_date", "grand_total", "status"],
        order_by="transaction_date desc",
        limit=5
    )
    
    return {
        "customer": customer.as_dict(),
        "recent_orders": orders
    }

@frappe.whitelist()
def create_contact_and_address(data):
    """Crée à la fois un contact et une adresse pour un client"""
    if isinstance(data, str):
        data = json.loads(data)
        
    customer_id = data.get("customer_id")
    if not customer_id:
        frappe.throw(_("ID client requis"))
    
    # Créer le contact
    contact = frappe.new_doc("Contact")
    contact.first_name = data.get("first_name")
    contact.last_name = data.get("last_name")
    contact.email_id = data.get("email")
    contact.phone = data.get("phone")
    
    # Lier au client
    contact.append("links", {
        "link_doctype": "Customer",
        "link_name": customer_id
    })
    
    contact.insert()
    
    # Créer l'adresse
    address = frappe.new_doc("Address")
    address.address_title = f"{data.get('first_name')} {data.get('last_name')}"
    address.address_line1 = data.get("address_line1")
    address.address_line2 = data.get("address_line2")
    address.city = data.get("city")
    address.country = data.get("country")
    address.postal_code = data.get("postal_code")
    
    # Lier au client
    address.append("links", {
        "link_doctype": "Customer",
        "link_name": customer_id
    })
    
    address.insert()
    
    return {
        "success": True,
        "contact": contact.name,
        "address": address.name
    }
```

### 2. Enregistrement des Méthodes d'API

Pour que vos méthodes soient disponibles, vous devez les enregistrer dans le fichier `hooks.py` de votre application:

```python
# Dans my_custom_app/hooks.py

# ...autres configurations...

# Exposer les méthodes API
api_version = 1

# ...autres configurations...
```

### 3. Appel des Méthodes d'API

#### Via HTTP REST

```
GET /api/method/my_custom_app.api.get_customer_info?customer_id=CUST-00001
```

```
POST /api/method/my_custom_app.api.create_contact_and_address
Content-Type: application/json

{
  "customer_id": "CUST-00001",
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@example.com",
  "phone": "+33123456789",
  "address_line1": "123 Rue Principale",
  "city": "Paris",
  "country": "France",
  "postal_code": "75001"
}
```

#### Via JavaScript (Frontend)

```javascript
// GET
frappe.call({
    method: "my_custom_app.api.get_customer_info",
    args: {
        customer_id: "CUST-00001"
    },
    callback: function(response) {
        if (response.message) {
            console.log(response.message.customer);
            console.log(response.message.recent_orders);
        }
    }
});

// POST
frappe.call({
    method: "my_custom_app.api.create_contact_and_address",
    args: {
        data: {
            customer_id: "CUST-00001",
            first_name: "Jean",
            last_name: "Dupont",
            email: "jean@example.com",
            phone: "+33123456789",
            address_line1: "123 Rue Principale",
            city: "Paris",
            country: "France",
            postal_code: "75001"
        }
    },
    callback: function(response) {
        if (response.message && response.message.success) {
            frappe.show_alert(`Contact ${response.message.contact} et adresse ${response.message.address} créés`);
        }
    }
});
```

### 4. Bonnes Pratiques pour les API

1. **Sécurité**: Utilisez toujours `@frappe.whitelist()` pour exposer vos méthodes. Pour exiger l'authentification:
   ```python
   @frappe.whitelist(allow_guest=False)
   def ma_methode_securisee():
       # Code
   ```

2. **Validation des données**: Validez toujours les entrées utilisateur:
   ```python
   @frappe.whitelist()
   def update_quantity(item_code, qty):
       if not item_code:
           frappe.throw("Code article requis")
       
       try:
           qty = float(qty)
           if qty <= 0:
               frappe.throw("Quantité doit être positive")
       except ValueError:
           frappe.throw("Quantité invalide")
       
       # Suite du code
   ```

3. **Gestion des transactions**: Utilisez les transactions pour garantir l'intégrité des données:
   ```python
   @frappe.whitelist()
   def create_multiple_records(data):
       try:
           # Votre code...
           frappe.db.commit()
           return {"success": True}
       except Exception as e:
           frappe.db.rollback()
           frappe.log_error(str(e), "Erreur création multiple")
           return {"success": False, "error": str(e)}
   ```

4. **Documentation**: Documentez vos API avec des docstrings clairs:
   ```python
   @frappe.whitelist()
   def get_stock_status(warehouse=None, item_code=None):
       """Récupère le statut de stock d'un article dans un entrepôt
       
       Args:
           warehouse (str, optional): Code de l'entrepôt. Si omis, tous les entrepôts.
           item_code (str, optional): Code de l'article. Si omis, tous les articles.
           
       Returns:
           dict: Statut du stock avec quantités
       """
       # Code
   ```

5. **Pagination**: Pour les listes longues, implémentez la pagination:
   ```python
   @frappe.whitelist()
   def list_customers(start=0, page_length=20, filters=None):
       """Liste les clients avec pagination
       
       Args:
           start (int): Index de départ
           page_length (int): Nombre d'éléments par page
           filters (dict): Filtres supplémentaires
           
       Returns:
           dict: Liste des clients et total
       """
       if isinstance(filters, str):
           filters = json.loads(filters)
           
       customers = frappe.get_list(
           "Customer",
           filters=filters or {},
           fields=["name", "customer_name", "territory"],
           start=int(start),
           page_length=int(page_length)
       )
       
       total = frappe.db.count("Customer", filters=filters)
       
       return {
           "data": customers,
           "total": total,
           "page_length": int(page_length),
           "page": int(int(start) / int(page_length)) + 1
       }
   ``` 