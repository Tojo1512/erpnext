import frappe
import json
import os
from frappe import _

@frappe.whitelist()
def reset_data():
    """
    Réinitialise toutes les tables de données qui ne sont pas dans la liste des tables protégées.
    """
    if not frappe.has_permission("System Manager"):
        frappe.throw(_("Vous n'avez pas les permissions nécessaires pour réinitialiser les données."))
    
    # Charger la liste des tables protégées depuis le fichier JSON
    protected_tables_path = os.path.join(os.path.dirname(frappe.get_module("erpnext.erpnext_integrations").__file__), 
                                       "page", "reset_data", "protected_tables.json")
    
    try:
        with open(protected_tables_path, 'r') as f:
            protected_data = json.load(f)
            protected_tables = set(protected_data.get("protected_tables", []))
    except Exception as e:
        frappe.log_error(f"Erreur lors du chargement des tables protégées: {str(e)}")
        return _("Erreur lors du chargement de la liste des tables protégées: {0}").format(str(e))
    
    # Obtenir toutes les tables du système
    all_tables = frappe.db.sql("SHOW TABLES", as_dict=False)
    all_table_names = [table[0] for table in all_tables]
    
    # Compteurs
    reset_count = 0
    failed_count = 0
    empty_tables = 0
    non_empty_reset = 0
    
    # Tables à ne pas toucher (tables protégées qui existent réellement)
    existing_protected_tables = [table for table in all_table_names if table in protected_tables]
    
    # Tables à réinitialiser (celles qui ne sont pas protégées)
    tables_to_reset = [table for table in all_table_names if table not in protected_tables]
    
    # Tables de séquences PostgreSQL qui nécessitent un traitement spécial
    sequence_tables = [
        "bisect_nodes_id_seq",
        "crm_note_id_seq",
        "ledger_health_id_seq",
        "prospect_opportunity_id_seq",
        "web_form_list_column_id_seq"
    ]
    
    frappe.db.begin()
    try:
        # 1. Traitement des tables normales
        for table_name in tables_to_reset:
            if table_name in sequence_tables:
                continue  # Les séquences seront traitées séparément
                
            try:
                # Vérifier si la table a des données
                row_count = frappe.db.sql(f"SELECT COUNT(*) FROM `{table_name}`")[0][0]
                if row_count == 0:
                    empty_tables += 1
                    continue  # Pas besoin de réinitialiser une table vide
                
                # Supprimer toutes les entrées
                frappe.db.sql(f"DELETE FROM `{table_name}`")
                
                # Réinitialiser l'auto-increment si applicable
                try:
                    frappe.db.sql(f"ALTER TABLE `{table_name}` AUTO_INCREMENT = 1")
                except:
                    pass  # Ignorer les erreurs si AUTO_INCREMENT n'existe pas
                
                reset_count += 1
                non_empty_reset += 1
                
            except Exception as e:
                frappe.log_error(f"Erreur lors de la réinitialisation de la table {table_name}: {str(e)}")
                failed_count += 1
                continue
        
        # 2. Traitement spécial pour les séquences PostgreSQL
        for seq in sequence_tables:
            if seq in tables_to_reset:
                try:
                    # Les séquences MySQL utilisent une syntaxe différente
                    try:
                        frappe.db.sql(f"ALTER SEQUENCE `{seq}` RESTART WITH 1")
                    except:
                        # Essayer la syntaxe MariaDB pour réinitialiser une table de séquence
                        frappe.db.sql(f"UPDATE `{seq}` SET next_not_cached_value = 1, cycle_count = 0")
                    
                    reset_count += 1
                except Exception as e:
                    frappe.log_error(f"Erreur lors de la réinitialisation de la séquence {seq}: {str(e)}")
                    failed_count += 1
        
        # 3. Réinitialiser les compteurs de série dans ERPNext
        series_to_reset = [
            "SO-", "SINV-", "PO-", "PINV-", "PE-", "STE-", 
            "DN-", "PR-", "JV-", "CRV-", "CPV-", "LEAD-", 
            "OPTY-", "QTN-"
        ]
        
        for series in series_to_reset:
            frappe.db.sql(f"UPDATE `tabSeries` SET current = 0 WHERE name = '{series}'")
        
        frappe.db.commit()
        
        # Message de succès détaillé
        tables_info = _("""
            Résumé de la réinitialisation:
            ---------------------------------
            Tables dans la base de données: {0}
            Tables protégées: {1} 
            Tables à réinitialiser: {2}
            
            Détails des tables à réinitialiser:
            ---------------------------------
            Tables vides (non modifiées): {3}
            Tables avec données (vidées): {4}
            Tables avec erreur: {5}
            Séquences réinitialisées: {6}
            
            Total des tables modifiées: {7}
        """).format(
            len(all_table_names),
            len(existing_protected_tables),
            len(tables_to_reset),
            empty_tables,
            non_empty_reset,
            failed_count,
            len([t for t in sequence_tables if t in tables_to_reset]), 
            reset_count
        )
        
        return _("Réinitialisation terminée.") + tables_info
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Erreur globale lors de la réinitialisation des données: {str(e)}")
        return _("Une erreur s'est produite lors de la réinitialisation des données: {0}").format(str(e)) 