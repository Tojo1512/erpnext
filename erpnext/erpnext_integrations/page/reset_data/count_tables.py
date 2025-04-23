import frappe
import json
import os

def count_tables():
    """Compte les tables dans la base de données et vérifie les tables protégées"""
    # Compter toutes les tables dans la base de données
    all_tables = frappe.db.sql("SHOW TABLES", as_dict=False)
    total_tables = len(all_tables)
    print(f"Nombre total de tables dans la base de données: {total_tables}")
    
    # Charger la liste des tables protégées
    protected_tables_path = os.path.join(os.path.dirname(frappe.get_module("erpnext.erpnext_integrations").__file__), 
                                      "page", "reset_data", "protected_tables.json")
    
    with open(protected_tables_path, 'r') as f:
        protected_data = json.load(f)
        protected_tables = set(protected_data.get("protected_tables", []))
        
    print(f"Nombre de tables dans la liste des tables protégées: {len(protected_tables)}")
    
    # Vérifier si toutes les tables protégées existent dans la base de données
    existing_tables = set([table[0] for table in all_tables])
    protected_not_existing = protected_tables - existing_tables
    
    if protected_not_existing:
        print(f"Tables dans la liste protégée qui n'existent pas dans la base de données ({len(protected_not_existing)}):")
        for table in sorted(protected_not_existing):
            print(f"  - {table}")
    
    # Calculer le nombre de tables à réinitialiser
    tables_to_reset = existing_tables - protected_tables
    print(f"Nombre de tables à réinitialiser: {len(tables_to_reset)}")
    
    # Afficher quelques tables à réinitialiser (max 10)
    if tables_to_reset:
        sample = list(sorted(tables_to_reset))[:10]
        print(f"Exemples de tables à réinitialiser:")
        for table in sample:
            print(f"  - {table}")

if __name__ == "__main__":
    count_tables() 