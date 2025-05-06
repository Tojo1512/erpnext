# Sécurité dans ERPNext

La sécurité est un aspect fondamental d'ERPNext, étant donné qu'il gère des données sensibles d'entreprise. Ce document détaille les différents mécanismes de sécurité implémentés dans le système.

## Architecture de Sécurité

ERPNext et le framework Frappe suivent une approche de sécurité multi-niveaux :

1. **Authentification** : Contrôle d'accès aux utilisateurs
2. **Autorisation** : Contrôle des permissions par rôle
3. **Sécurité des données** : Protection des données sensibles
4. **Sécurité de l'application** : Protection contre les vulnérabilités communes
5. **Sécurité de l'infrastructure** : Sécurisation du déploiement

## Système d'Authentification

### 1. Méthodes d'Authentification

ERPNext prend en charge plusieurs méthodes d'authentification :

- **Authentification par mot de passe** : Méthode standard avec hachage sécurisé
- **Authentification OAuth** : Intégration avec des fournisseurs comme Google, GitHub
- **Authentification LDAP** : Pour l'intégration avec des annuaires d'entreprise
- **Authentification à deux facteurs (2FA)** : Couche de sécurité supplémentaire

### 2. Gestion des Sessions

Les sessions utilisateur sont gérées de manière sécurisée :

- Cookies de session sécurisés (HTTPOnly, Secure)
- Expiration automatique des sessions inactives
- Possibilité de forcer la déconnexion de toutes les sessions

```python
# Exemple de configuration de sécurité des sessions dans site_config.json
{
    "session_expiry": 3600,  # Expiration en secondes
    "secure_session_cookie": true,  # Cookie HTTPS uniquement
    "http_only_cookie": true  # Protection XSS
}
```

## Système d'Autorisation

### 1. Modèle de Permissions Basé sur les Rôles

ERPNext utilise un système de contrôle d'accès basé sur les rôles (RBAC) :

1. **Utilisateurs** : Personnes qui utilisent le système
2. **Rôles** : Groupes de permissions (ex : "Sales Manager", "HR User")
3. **Permissions** : Définies pour chaque DocType et rôle

### 2. Niveaux de Permissions

Les permissions sont définies à plusieurs niveaux :

- **Niveau DocType** : Permissions globales sur un type de document
- **Niveau Document** : Permissions sur des documents spécifiques
- **Niveau Champ** : Permissions sur des champs spécifiques
- **Règles de permission utilisateur** : Restrictions basées sur des valeurs spécifiques

### 3. Matrice de Permissions

La matrice de permissions définit les actions autorisées par rôle :

```json
{
  "permissions": [
    {
      "role": "Sales Manager",
      "read": 1,
      "write": 1,
      "create": 1,
      "delete": 1,
      "submit": 1,
      "cancel": 1,
      "amend": 1,
      "report": 1,
      "export": 1
    },
    {
      "role": "Sales User",
      "read": 1,
      "write": 1,
      "create": 1,
      "submit": 1,
      "report": 1,
      "export": 1
    }
  ]
}
```

### 4. Vérification des Permissions

Les permissions sont vérifiées automatiquement pour chaque opération :

```python
# Vérification automatique des permissions
doc = frappe.get_doc("Sales Invoice", "INV-00001")  # Vérifie les permissions de lecture

# Vérification manuelle des permissions
if frappe.has_permission("Sales Invoice", "write", doc):
    # Effectuer une opération d'écriture
```

## Sécurité des Données

### 1. Chiffrement des Données Sensibles

Les données sensibles peuvent être chiffrées dans la base de données :

```python
# Définition d'un champ chiffré dans un DocType
{
  "fieldname": "credit_card",
  "fieldtype": "Data",
  "label": "Credit Card Number",
  "encrypt": 1  # Ce champ sera chiffré dans la base de données
}
```

### 2. Contrôle d'Accès aux Données

L'accès aux données est restreint selon plusieurs mécanismes :

- **Document Ownership** : Restriction à ses propres documents
- **User Permissions** : Restriction basée sur des valeurs spécifiques (ex : uniquement les clients d'une région)
- **Règles de partage** : Partage explicite de documents avec des utilisateurs spécifiques

```python
# Exemple de règle de permission utilisateur
frappe.create_doc({
    "doctype": "User Permission",
    "user": "user@example.com",
    "allow": "Customer Group",
    "for_value": "Retail"
})  # L'utilisateur ne verra que les clients du groupe "Retail"
```

### 3. Journalisation des Accès

ERPNext enregistre tous les accès et modifications aux données sensibles :

- Journal d'audit des modifications de documents
- Journal d'accès pour les données sensibles
- Suivi des connexions utilisateurs

## Sécurité de l'Application

### 1. Protection Contre les Attaques Web

ERPNext implémente des protections contre les attaques web courantes :

- **XSS (Cross-Site Scripting)** : Échappement automatique des données affichées
- **CSRF (Cross-Site Request Forgery)** : Tokens anti-CSRF pour toutes les requêtes
- **Injection SQL** : Paramètres préparés et ORM sécurisé
- **Clickjacking** : En-têtes X-Frame-Options
- **CORS (Cross-Origin Resource Sharing)** : Configuration restrictive par défaut

### 2. Validation des Entrées

Toutes les entrées utilisateur sont validées à plusieurs niveaux :

```python
# Validation côté serveur dans les contrôleurs
def validate(self):
    if not self.amount > 0:
        frappe.throw(_("Amount must be positive"))
    
    # Validation de format
    if not re.match(r'^[A-Z]{2}\d{9}$', self.invoice_number):
        frappe.throw(_("Invalid invoice number format"))
```

### 3. Sécurité des API

Les API sont sécurisées par plusieurs mécanismes :

- Authentification via tokens API ou cookies de session
- Contrôle d'accès basé sur les autorisations (`@frappe.whitelist()`)
- Rate limiting pour prévenir les abus

```python
# Sécurisation d'une méthode d'API
@frappe.whitelist()
def update_order_status(order_id, status):
    # Vérification supplémentaire des permissions
    if not frappe.has_permission("Sales Order", "write"):
        frappe.throw(_("No Permission"), frappe.PermissionError)
    
    # Validation des entrées
    if status not in ["Pending", "Completed", "Cancelled"]:
        frappe.throw(_("Invalid Status"))
    
    # Traitement sécurisé
    doc = frappe.get_doc("Sales Order", order_id)
    doc.status = status
    doc.save()
```

## Sécurité de l'Infrastructure

### 1. Configuration Sécurisée

Recommandations pour une configuration sécurisée :

- Utilisation de HTTPS avec TLS 1.2+
- Configuration sécurisée du serveur web (Nginx/Apache)
- Pare-feu et règles de réseau restrictives
- Protection DoS/DDoS (Denial of Service)

### 2. Déploiement Sécurisé

Bonnes pratiques pour un déploiement sécurisé :

- Séparation des environnements (développement, test, production)
- Principe du moindre privilège pour les comptes système
- Mises à jour régulières des dépendances et du système
- Sauvegardes chiffrées et testées régulièrement

## Gestion des Vulnérabilités

### 1. Divulgation Responsable

ERPNext a mis en place un processus de divulgation responsable des vulnérabilités :

- Adresse email dédiée pour les rapports de sécurité
- Programme de récompense pour les failles de sécurité
- Corrections rapides des vulnérabilités critiques

### 2. Audits de Sécurité

Pratiques recommandées pour les audits :

- Audits de code réguliers
- Tests de pénétration
- Analyse de vulnérabilités automatisée
- Revue des journaux de sécurité

## Conformité et Standards

ERPNext peut être configuré pour répondre à diverses normes de conformité :

- **GDPR** : Protection des données personnelles
- **SOX** : Contrôles financiers
- **HIPAA** : Données de santé (avec configurations supplémentaires)
- **PCI DSS** : Traitement des paiements (avec configurations supplémentaires)

## Conseils de Sécurité pour les Administrateurs

1. **Politique de mot de passe robuste** : Longueur minimale, complexité, rotation
2. **Activation de l'authentification à deux facteurs** (2FA)
3. **Revue régulière des permissions utilisateur**
4. **Surveillances des journaux d'accès et d'audit**
5. **Mises à jour régulières** de la plateforme
6. **Sauvegardes chiffrées** et testées régulièrement
7. **Formation des utilisateurs** aux bonnes pratiques de sécurité 