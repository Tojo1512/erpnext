import frappe
from frappe import _
import csv
from datetime import datetime
from frappe.utils import getdate, cstr
import base64
import io

# Configuration globale
ALLOW_WAREHOUSE_CREATION = False  # Mettre à True pour permettre la création de nouveaux entrepôts

def get_warehouse_name(warehouse_name):
    """Obtenir le nom correct de l'entrepôt"""
    if warehouse_name == "All Warehouse":
        return "All Warehouses - ITU"
    return warehouse_name

def create_warehouse(warehouse_name):
    """Récupérer ou créer un entrepôt selon la configuration"""
    warehouse_name = get_warehouse_name(warehouse_name)
    
    # Vérifier si l'entrepôt existe
    if frappe.db.exists("Warehouse", warehouse_name):
        return warehouse_name
        
    # Si l'entrepôt n'existe pas
    if not ALLOW_WAREHOUSE_CREATION:
        frappe.throw(_(f"L'entrepôt {warehouse_name} n'existe pas et la création automatique est désactivée"))
    
    # Création de l'entrepôt si autorisé
    try:
        warehouse = frappe.get_doc({
            "doctype": "Warehouse",
            "warehouse_name": warehouse_name.replace(" - ITU", ""),
            "company": frappe.defaults.get_user_default("Company"),
            "parent_warehouse": "All Warehouses - ITU"
        })
        warehouse.insert(ignore_permissions=True)
        frappe.logger().info(f"Nouvel entrepôt créé: {warehouse.name}")
        return warehouse.name
    except Exception as e:
        frappe.logger().error(f"Erreur lors de la création de l'entrepôt: {str(e)}")
        raise

@frappe.whitelist()
def import_fichier_1(file_content):
    """Import des données avec gestion des entrepôts selon ALLOW_WAREHOUSE_CREATION"""
    try:
        # Décoder le contenu base64
        decoded_content = base64.b64decode(file_content).decode('utf-8')
        
        # Créer un lecteur CSV à partir du contenu décodé
        csv_file = io.StringIO(decoded_content)
        csv_reader = csv.DictReader(csv_file)
        
        # Vérifier les en-têtes requis
        required_headers = ['date', 'item_name', 'item_groupe', 'required_by', 'quantity', 'purpose', 'target_warehouse', 'ref']
        csv_headers = csv_reader.fieldnames
        
        if not csv_headers or not all(header in csv_headers for header in required_headers):
            frappe.throw(_("Format de fichier invalide. Veuillez vérifier le modèle."))

        # Liste pour stocker les erreurs et les succès
        errors = []
        success_count = 0
        created_requests = []

        # Vérifier la company par défaut
        default_company = frappe.defaults.get_user_default("Company")
        if not default_company:
            frappe.throw(_("Aucune société par défaut définie pour l'utilisateur"))

        for row in csv_reader:
            try:
                frappe.logger().debug(f"Traitement de la ligne {csv_reader.line_num}")
                
                # Vérifier les données requises
                if not all(row.get(field) for field in required_headers):
                    errors.append(f"Ligne {csv_reader.line_num}: Données manquantes")
                    continue

                # Validation des dates
                try:
                    transaction_date = getdate(row['date'])
                    schedule_date = getdate(row['required_by'])
                except Exception as e:
                    errors.append(f"Ligne {csv_reader.line_num}: Format de date invalide - {str(e)}")
                    continue

                # Validation de la quantité
                try:
                    quantity = float(row['quantity'])
                    if quantity <= 0:
                        errors.append(f"Ligne {csv_reader.line_num}: La quantité doit être supérieure à 0")
                        continue
                except ValueError:
                    errors.append(f"Ligne {csv_reader.line_num}: Quantité invalide")
                    continue

                # Créer ou mettre à jour Item Group
                try:
                    item_group = create_item_group(row['item_groupe'])
                    frappe.logger().debug(f"Item Group créé/trouvé: {item_group}")
                except Exception as e:
                    errors.append(f"Ligne {csv_reader.line_num}: Erreur création groupe - {str(e)}")
                    continue
                
                # Créer ou mettre à jour Item
                try:
                    item_code = create_item(row['item_name'], row['item_groupe'])
                    frappe.logger().debug(f"Item créé/trouvé: {item_code}")
                except Exception as e:
                    errors.append(f"Ligne {csv_reader.line_num}: Erreur création item - {str(e)}")
                    continue
                
                # Gérer l'entrepôt selon la configuration
                try:
                    warehouse_name = create_warehouse(row['target_warehouse'])
                    frappe.logger().debug(f"Entrepôt utilisé: {warehouse_name} (création autorisée: {ALLOW_WAREHOUSE_CREATION})")
                except Exception as e:
                    errors.append(f"Ligne {csv_reader.line_num}: Erreur entrepôt - {str(e)}")
                    continue
                
                # Vérifier si le type de Material Request est valide
                valid_request_types = ["Purchase", "Material Transfer", "Material Issue", "Manufacture"]
                if row['purpose'] not in valid_request_types:
                    errors.append(f"Ligne {csv_reader.line_num}: Type de demande invalide. Types valides: {', '.join(valid_request_types)}")
                    continue

                # Créer Material Request
                try:
                    mr_name = create_material_request(row, item_code, warehouse_name)
                    created_requests.append(mr_name)
                    frappe.logger().debug(f"Material Request créé: {mr_name}")
                    success_count += 1
                except Exception as e:
                    errors.append(f"Ligne {csv_reader.line_num}: Erreur création Material Request - {str(e)}")
                    continue

            except Exception as e:
                errors.append(f"Ligne {csv_reader.line_num}: {str(e)}")
                frappe.logger().error(f"Erreur détaillée: {frappe.get_traceback()}")
        
        # Commit seulement si au moins une ligne a été traitée avec succès
        if success_count > 0:
            frappe.db.commit()
            frappe.logger().info(f"Commit effectué. {success_count} Material Requests créés")
        else:
            frappe.db.rollback()
            frappe.logger().warning("Aucun Material Request créé - Rollback effectué")
        
        # Préparer le message de retour
        message = f"Importation terminée. {success_count} ligne(s) importée(s) avec succès."
        if created_requests:
            message += f"\nMaterial Requests créés: {', '.join(created_requests)}"
        if errors:
            message += f"\nErreurs ({len(errors)}):\n" + "\n".join(errors)
        
        return {
            "success": success_count > 0,
            "message": message,
            "total_success": success_count,
            "total_errors": len(errors),
            "created_requests": created_requests,
            "warehouse_creation_enabled": ALLOW_WAREHOUSE_CREATION
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.logger().error(f"Erreur globale: {frappe.get_traceback()}")
        return {"success": False, "message": str(e)}

def create_item_group(group_name):
    """Créer ou récupérer un Item Group"""
    if not frappe.db.exists("Item Group", group_name):
        item_group = frappe.get_doc({
            "doctype": "Item Group",
            "item_group_name": group_name,
            "parent_item_group": "All Item Groups"
        })
        item_group.insert(ignore_permissions=True)
        frappe.logger().info(f"Nouveau Item Group créé: {group_name}")
    return group_name

def create_item(item_name, item_group):
    """Créer ou récupérer un Item"""
    item_code = frappe.scrub(item_name)  # Génère un code propre basé sur le nom
    
    if not frappe.db.exists("Item", item_code):
        item = frappe.get_doc({
            "doctype": "Item",
            "item_code": item_code,
            "item_name": item_name,
            "item_group": item_group,
            "is_stock_item": 1,
            "include_item_in_manufacturing": 1,
            "stock_uom": "Nos",  # Unité de mesure par défaut
            "description": f"Article créé automatiquement depuis l'import CSV - {item_name}"
        })
        item.insert(ignore_permissions=True)
        frappe.logger().info(f"Nouvel Item créé: {item_code}")
    return item_code

def create_material_request(row, item_code, warehouse_name):
    """Créer une Material Request"""
    try:
        # Obtenir le nom correct de l'entrepôt
        actual_warehouse = get_warehouse_name(warehouse_name)
        
        # Vérifier que l'entrepôt existe bien
        if not frappe.db.exists("Warehouse", actual_warehouse):
            frappe.throw(_(f"L'entrepôt {actual_warehouse} n'existe pas dans le système"))
        
        material_request = frappe.get_doc({
            "doctype": "Material Request",
            "material_request_type": row['purpose'],
            "transaction_date": getdate(row['date']),
            "schedule_date": getdate(row['required_by']),
            "company": frappe.defaults.get_user_default("Company"),
            "items": [{
                "doctype": "Material Request Item",
                "item_code": item_code,
                "qty": float(row['quantity']),
                "warehouse": actual_warehouse,
                "schedule_date": getdate(row['required_by'])
            }]
        })
        
        frappe.logger().debug(f"Tentative de création Material Request pour item: {item_code} dans l'entrepôt: {actual_warehouse}")
        material_request.insert(ignore_permissions=True)
        frappe.logger().debug(f"Material Request inséré: {material_request.name}")
        
        material_request.submit()
        frappe.logger().info(f"Material Request soumis: {material_request.name}")
        
        return material_request.name
    except Exception as e:
        frappe.logger().error(f"Erreur création Material Request: {str(e)}\n{frappe.get_traceback()}")
        raise 