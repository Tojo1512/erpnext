import frappe
from frappe import _
import csv
from datetime import datetime
import base64
import io

@frappe.whitelist()
def export_fichier_1(material_request_names):
    """
    Exporter les Material Requests au format CSV
    Args:
        material_request_names: Liste des noms de Material Request à exporter
    Returns:
        str: Contenu CSV encodé en base64
    """
    try:
        if isinstance(material_request_names, str):
            material_request_names = frappe.parse_json(material_request_names)

        # En-têtes du CSV
        headers = ['date', 'item_name', 'item_groupe', 'required_by', 'quantity', 'purpose', 'target_warehouse', 'ref']
        
        # Créer un buffer pour écrire le CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()

        for mr_name in material_request_names:
            mr_doc = frappe.get_doc("Material Request", mr_name)
            
            for item in mr_doc.items:
                item_doc = frappe.get_doc("Item", item.item_code)
                row = {
                    'date': mr_doc.transaction_date,
                    'item_name': item_doc.item_name,
                    'item_groupe': item_doc.item_group,
                    'required_by': mr_doc.schedule_date,
                    'quantity': item.qty,
                    'purpose': mr_doc.material_request_type,
                    'target_warehouse': item.warehouse,
                    'ref': mr_doc.name
                }
                writer.writerow(row)

        # Encoder le contenu en base64
        csv_content = output.getvalue()
        encoded_content = base64.b64encode(csv_content.encode('utf-8')).decode('utf-8')
        
        return {
            "success": True,
            "content": encoded_content,
            "filename": f"material_requests_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }

    except Exception as e:
        frappe.logger().error(f"Erreur export fichier 1: {frappe.get_traceback()}")
        return {"success": False, "message": str(e)}

@frappe.whitelist()
def export_fichier_2(supplier_names):
    """
    Exporter les fournisseurs au format CSV
    Args:
        supplier_names: Liste des noms de fournisseurs à exporter
    Returns:
        str: Contenu CSV encodé en base64
    """
    try:
        if isinstance(supplier_names, str):
            supplier_names = frappe.parse_json(supplier_names)

        # En-têtes du CSV
        headers = ['supplier_name', 'country', 'type']
        
        # Créer un buffer pour écrire le CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()

        for supplier_name in supplier_names:
            supplier = frappe.get_doc("Supplier", supplier_name)
            row = {
                'supplier_name': supplier.supplier_name,
                'country': supplier.country,
                'type': supplier.supplier_type
            }
            writer.writerow(row)

        # Encoder le contenu en base64
        csv_content = output.getvalue()
        encoded_content = base64.b64encode(csv_content.encode('utf-8')).decode('utf-8')
        
        return {
            "success": True,
            "content": encoded_content,
            "filename": f"suppliers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }

    except Exception as e:
        frappe.logger().error(f"Erreur export fichier 2: {frappe.get_traceback()}")
        return {"success": False, "message": str(e)}