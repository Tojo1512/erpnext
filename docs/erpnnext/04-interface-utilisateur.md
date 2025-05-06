# Interface Utilisateur dans ERPNext

ERPNext possède une architecture frontend moderne qui s'appuie sur le framework Frappe pour créer une expérience utilisateur dynamique et réactive. Ce document explique la structure et le fonctionnement de la couche de présentation.

## Architecture Frontend

L'interface utilisateur d'ERPNext est construite selon une architecture multi-couches :

1. **HTML/Jinja2 Templates** : Génération du HTML côté serveur
2. **JavaScript Client** : Logique interactive côté client
3. **CSS/SCSS** : Styles et mise en page
4. **Client-side Framework** : Utilisation de Frappe.js (basé sur le design pattern Observable)

## Structure des Fichiers Frontend

Les fichiers frontend sont principalement organisés dans les dossiers suivants :

```
erpnext/
├── public/                    # Ressources statiques
│   ├── js/                    # Scripts JavaScript
│   │   ├── controllers/       # Contrôleurs JS
│   │   ├── utils/             # Utilitaires JS
│   │   └── templates/         # Templates JS
│   ├── scss/                  # Fichiers de style SCSS
│   ├── images/                # Images et icônes
│   └── dist/                  # Fichiers compilés et minifiés
├── templates/                 # Templates Jinja2
│   ├── includes/              # Fragments de templates réutilisables
│   ├── pages/                 # Templates de pages complètes
│   └── generators/            # Templates générateurs de contenu
└── www/                       # Pages web publiques
```

## Système de Templates

ERPNext utilise le moteur de templates Jinja2 pour générer le HTML côté serveur :

1. **Templates de Base** : Définissent la structure générale
2. **Templates de Page** : Spécifiques à chaque type de page
3. **Templates Partiels** : Composants réutilisables

Exemple de template Jinja2 :

```html
{% extends "templates/web.html" %}

{% block page_content %}
<div class="row">
    <div class="col-md-6">
        <h2>{{ doc.title }}</h2>
        <div>{{ doc.description }}</div>
    </div>
    <div class="col-md-6">
        <img src="{{ doc.image }}" alt="{{ doc.title }}">
    </div>
</div>
{% endblock %}
```

## Architecture JavaScript

Le code JavaScript dans ERPNext suit une structure modulaire :

1. **Modules par DocType** : Chaque DocType peut avoir son propre fichier JS
2. **Classes JavaScript** : Représentent les contrôleurs de formulaire et de liste
3. **Modèle d'événements** : Communication entre composants via des événements

### Formulaires

Les formulaires sont définis par des fichiers JavaScript correspondant à chaque DocType :

```
erpnext/public/js/
└── sales_invoice.js           # Contrôleur JS pour le formulaire Sales Invoice
```

Exemple de code :

```javascript
frappe.ui.form.on('Sales Invoice', {
    // Événement déclenché lors du chargement du formulaire
    onload: function(frm) {
        frm.set_query("item_code", "items", function() {
            return {
                filters: {
                    "is_sales_item": 1
                }
            };
        });
    },
    
    // Événement déclenché après la soumission du formulaire
    after_save: function(frm) {
        frm.reload_doc();
    },
    
    // Méthode personnalisée invocable depuis le formulaire
    make_delivery: function(frm) {
        frappe.model.open_mapped_doc({
            method: "erpnext.accounts.doctype.sales_invoice.sales_invoice.make_delivery_note",
            frm: frm
        });
    }
});
```

### Listes et Rapports

Les vues de liste et les rapports sont également personnalisables via JavaScript :

```javascript
frappe.listview_settings['Sales Invoice'] = {
    add_fields: ["customer", "status", "due_date", "grand_total"],
    get_indicator: function(doc) {
        if(doc.status === "Unpaid") {
            return [__("Unpaid"), "orange", "status,=,Unpaid"];
        } else if(doc.status === "Paid") {
            return [__("Paid"), "green", "status,=,Paid"];
        }
    }
};
```

## Communication Client-Serveur

La communication entre le client et le serveur se fait via :

1. **Appels AJAX** : Pour récupérer ou envoyer des données
2. **Méthodes Whitelisted** : Fonctions Python exposées au client via `@frappe.whitelist()`
3. **WebSockets** : Pour les mises à jour en temps réel

Exemple d'appel d'une méthode serveur depuis le client :

```javascript
// Côté client
frappe.call({
    method: "erpnext.accounts.doctype.sales_invoice.sales_invoice.get_payment_details",
    args: {
        invoice_name: frm.doc.name
    },
    callback: function(r) {
        if(!r.exc) {
            frm.set_value("payment_details", r.message);
        }
    }
});

// Côté serveur (sales_invoice.py)
@frappe.whitelist()
def get_payment_details(invoice_name):
    # Logique pour récupérer les détails de paiement
    return {"amount_paid": 1000, "outstanding": 500}
```

## Composants d'Interface Utilisateur

ERPNext utilise plusieurs types de composants d'interface :

1. **Formulaires** : Pour la saisie et la modification des données
2. **Listes** : Pour afficher des collections d'enregistrements
3. **Rapports** : Pour présenter des données agrégées
4. **Tableaux de bord** : Pour visualiser des indicateurs de performance
5. **Calendriers** : Pour les affichages temporels
6. **Kanban** : Pour les affichages de type flux de travail

## Mise en Page et Style

ERPNext utilise Bootstrap comme framework CSS de base, avec ses propres personnalisations :

1. **SCSS** : Utilisé pour définir les styles personnalisés
2. **Thèmes** : Possibilité de personnaliser l'apparence via des thèmes
3. **Design Responsive** : Adaptatif pour différentes tailles d'écran

## Portail Web Public

ERPNext dispose d'une interface de portail web destinée aux utilisateurs externes :

1. **Pages Publiques** : Accès sans authentification
2. **Portail Client** : Accès authentifié pour les clients
3. **Portail Fournisseur** : Accès authentifié pour les fournisseurs

## Exemple de Flux d'Interface Utilisateur

Un exemple de flux d'interface utilisateur pour créer une facture de vente :

1. L'utilisateur clique sur "Nouvelle facture de vente"
2. Le formulaire se charge avec les champs requis et les listes déroulantes pré-remplies
3. L'utilisateur sélectionne un client, déclenchant un événement JavaScript
4. Le système charge automatiquement les adresses et les conditions de paiement du client
5. L'utilisateur ajoute des articles à la facture via une grille interactive
6. Le système calcule automatiquement les sous-totaux, taxes et totaux
7. L'utilisateur soumet le formulaire, déclenchant des validations côté client puis côté serveur
8. Une fois validée, la facture est enregistrée et l'utilisateur est redirigé vers la vue détaillée 