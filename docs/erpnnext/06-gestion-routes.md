# Gestion des Routes dans ERPNext

ERPNext utilise un système de routage sophistiqué pour gérer les URL et la navigation au sein de l'application. Ce document explique comment les routes sont définies, gérées et personnalisées.

## Architecture de Routage

Le routage dans ERPNext / Frappe est organisé en plusieurs couches :

1. **Routes d'Application** : Gérées par le framework Frappe (backend)
2. **Routes Web** : Pour les pages web publiques et le portail
3. **Routes d'API** : Pour les endpoints REST et les méthodes whitelisted
4. **Routes Client-Side** : Gérées par le routeur JavaScript côté client

## Définition des Routes

### Routes Backend (Serveur)

Les routes backend sont principalement définies dans le fichier `hooks.py` à travers différents hooks :

```python
# Dans hooks.py
website_route_rules = [
    {"from_route": "/orders", "to_route": "Sales Order"},
    {
        "from_route": "/orders/<path:name>",
        "to_route": "order",
        "defaults": {
            "doctype": "Sales Order",
            "parents": [{"label": "Orders", "route": "orders"}]
        }
    },
    {"from_route": "/invoices", "to_route": "Sales Invoice"},
    # ... plus de règles de routage
]
```

Ces routes mappent des URL aux types de documents (DocTypes) ou à des pages spécifiques.

### Routes de Page Web

Les pages web statiques sont définies dans le dossier `www/` sous forme de fichiers HTML ou Markdown :

```
erpnext/www/
├── about.html                 # Page accessible via /about
├── contact.html               # Page accessible via /contact
└── products/
    └── index.html             # Page accessible via /products
```

### Routes Dynamiques

Les pages générées dynamiquement utilisent des "Web Templates" ou des "Generators" définis dans le code Python :

```python
# Exemple de définition de route dynamique pour les articles de blog
class BlogPost(Document, WebsiteGenerator):
    website = frappe._dict(
        route = 'blog',
        template = 'templates/generators/blog_post.html',
        condition_field = 'published',
        order_by = 'published_on desc'
    )
```

## Système de Routage

### 1. Résolution des Routes

Lorsqu'une requête atteint le serveur, le processus de résolution de route est le suivant :

1. Vérification des routes explicites défines dans `website_route_rules`
2. Recherche d'une page statique dans le dossier `www/`
3. Vérification des générateurs de contenu (blog, produits, etc.)
4. Résolution basée sur les DocTypes (pages de liste et de détail)
5. Recherche dans les routes personnalisées définies par les applications

### 2. Routage par DocType

Le framework Frappe génère automatiquement des routes pour les DocTypes marqués comme visibles sur le web :

- Liste : `/doctype` (ex: `/customers`)
- Détail : `/doctype/name` (ex: `/customer/ABC001`)

### 3. Routage API

Les API REST sont accessibles via des routes spécifiques :

- API REST standard : `/api/resource/<doctype>/[<name>]`
- Méthodes whitelisted : `/api/method/<app>.<module>.<method>`

## Routes dans le Frontend

Les routes côté client sont gérées par un routeur JavaScript qui permet la navigation sans rechargement complet de page :

```javascript
// Exemple de navigation côté client
frappe.set_route('Form', 'Sales Invoice', 'INV-00001');  // Navigue vers un formulaire
frappe.set_route('List', 'Customer');                    // Navigue vers une liste
frappe.set_route('Tree', 'Account');                     // Navigue vers une vue arborescente
```

## Structure des URL

Les URL dans ERPNext suivent généralement ces formats :

1. **Pages de formulaire** : `/app/doctype/name` (ex: `/app/sales-invoice/INV-00001`)
2. **Pages de liste** : `/app/doctype` (ex: `/app/customer`)
3. **Pages de rapport** : `/app/query-report/report-name` (ex: `/app/query-report/sales-analytics`)
4. **Pages web** : `/page-name` (ex: `/about-us`)
5. **Pages de portail** : `/my-orders`, `/my-invoices`

## Personnalisation des Routes

### 1. Ajouter des Routes Personnalisées

Vous pouvez ajouter des routes personnalisées via `hooks.py` :

```python
website_route_rules = [
    {"from_route": "/custom-page", "to_route": "custom_module.custom_page.get_page"}
]
```

Et définir le handler correspondant :

```python
# Dans custom_module/custom_page.py
def get_page(context):
    context.title = "Ma Page Personnalisée"
    return context
```

### 2. Routes de Portail

Le portail web peut avoir des routes personnalisées définies via :

```python
portal_menu_items = [
    {"title": "Mes Commandes", "route": "/orders", "reference_doctype": "Sales Order", "role": "Customer"}
]
```

### 3. Alias et Redirections

Vous pouvez définir des redirections d'URL :

```python
website_redirects = [
    {"source": "/old-page", "target": "/new-page"}
]
```

## Middleware et Filtres

Frappe permet de définir des middleware qui interceptent les requêtes HTTP :

```python
# Dans hooks.py
website_request_hooks = [
    {"method": "my_custom_app.auth.validate_request", "path": "/api/method/my_custom_method"}
]
```

Ces middleware peuvent contrôler l'accès aux routes, modifier les requêtes, etc.

## Paramètres d'URL

Les paramètres d'URL sont gérés de deux façons :

1. **Paramètres de chemin** : `/orders/<name>` où `<name>` est un paramètre
2. **Paramètres de requête** : `/orders?status=pending&limit=10`

Récupération des paramètres :

```python
# Paramètres de chemin
@frappe.whitelist()
def get_order(name):
    return frappe.get_doc("Sales Order", name)

# Paramètres de requête
@frappe.whitelist()
def list_orders():
    status = frappe.request.args.get('status')
    limit = frappe.request.args.get('limit', 20)
    return frappe.get_list("Sales Order", filters={"status": status}, limit=limit)
```

## Sécurité des Routes

### 1. Permissions par DocType

L'accès aux routes liées aux DocTypes est contrôlé par le système de permissions de Frappe :

```python
# Définition des permissions dans doctype JSON ou via l'interface
{
    "permissions": [
        {
            "role": "Sales Manager",
            "read": 1,
            "write": 1,
            "delete": 1
        },
        {
            "role": "Sales User",
            "read": 1,
            "write": 1
        }
    ]
}
```

### 2. Authentication et Autorisation

Pour les routes API et les méthodes whitelisted :

```python
@frappe.whitelist()  # Accessible via API pour tout utilisateur connecté
def public_method():
    return "Accessible à tous les utilisateurs connectés"

@frappe.whitelist(allow_guest=True)  # Accessible sans authentification
def guest_method():
    return "Accessible sans connexion"

# Vérification manuelle des autorisations
@frappe.whitelist()
def restricted_method():
    if not frappe.has_permission("Sales Invoice", "write"):
        frappe.throw(_("No Permission"))
    return "Accès autorisé"
```

### 3. CSRF Protection

Frappe protège contre les attaques CSRF en utilisant des tokens de validation.

## Flux d'Exécution d'une Requête

1. La requête atteint le serveur web (Nginx/Apache)
2. Le serveur transmet la requête à l'application Python (via WSGI)
3. Le système de routage Frappe identifie la route correspondante
4. Les middleware sont exécutés (authentification, autorisation)
5. Le contrôleur correspondant est appelé
6. Le résultat est renvoyé au client (HTML, JSON, etc.)

## Exemples de Routes Courantes

### Routes d'Application

- `/app/home` : Tableau de bord
- `/app/sales-invoice/new` : Nouveau formulaire de facture
- `/app/customer/CUST0001` : Détails d'un client
- `/app/item/list` : Liste des articles

### Routes Web

- `/about` : Page À propos
- `/contact` : Page Contact
- `/products` : Liste des produits

### Routes d'API

- `/api/resource/Sales Invoice` : Récupérer la liste des factures (GET)
- `/api/resource/Sales Invoice/INV001` : Récupérer une facture spécifique (GET)
- `/api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_delivery_note` : Appeler une méthode whitelisted 