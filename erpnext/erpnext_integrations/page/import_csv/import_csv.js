frappe.pages['import-csv'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Import des données dans le format csv',
		single_column: true
	});

	// Styles simplifiés
	const styles = `
		<style>
			.import-container {
				max-width: 500px;
				margin: 20px auto;
				padding: 20px;
				background: #fff;
				border: 1px solid #e2e8f0;
				border-radius: 6px;
			}

			.import-title {
				font-size: 16px;
				color: #1a202c;
				margin-bottom: 20px;
				text-align: center;
			}

			.file-upload-zone {
				border: 2px dashed #cbd5e0;
				padding: 30px 20px;
				text-align: center;
				background: #f8fafc;
				margin-bottom: 20px;
				cursor: pointer;
			}

			.file-upload-zone:hover {
				border-color: #4299e1;
				background: #ebf8ff;
			}

			.file-input {
				width: 100%;
				margin-bottom: 5px;
			}

			.help-text {
				font-size: 12px;
				color: #718096;
				margin: 10px 0;
				text-align: center;
			}

			.action-buttons {
				display: flex;
				gap: 10px;
				justify-content: center;
				margin-top: 20px;
			}

			.btn-import {
				background-color: #4299e1;
				color: white;
				padding: 8px 16px;
				border: none;
				border-radius: 4px;
				cursor: pointer;
			}

			.btn-import:hover {
				background-color: #3182ce;
			}

			.btn-template {
				color: #4299e1;
				text-decoration: underline;
				background: none;
				border: none;
				cursor: pointer;
			}

			.btn-template:hover {
				color: #3182ce;
			}

			.icon {
				margin-right: 8px;
			}
		</style>
	`;

	// Ajouter les styles à la page
	$(styles).appendTo(page.main);

	// Interface simplifiée
	let import_form = $(`
		<div class="import-container">
			<div class="import-title">
				Importation de fichier CSV
			</div>
			<div class="file-upload-zone">
				<input type="file" class="file-input" id="csv-file" accept=".csv" />
				<div class="help-text">
					Glissez votre fichier CSV ici ou cliquez pour sélectionner
				</div>
			</div>
			<div class="action-buttons">
				<button class="btn-import" id="btn-import">
					<i class="fa fa-upload icon"></i>Importer
				</button>
				<button class="btn-template" id="download-template">
					<i class="fa fa-download icon"></i>Télécharger le modèle
				</button>
			</div>
		</div>
	`).appendTo(page.main);

	// Gérer le clic sur le bouton d'importation
	import_form.find('#btn-import').on('click', function() {
		let file_input = import_form.find('#csv-file').get(0);
		if (!file_input.files.length) {
			frappe.throw(__('Veuillez sélectionner un fichier CSV'));
			return;
		}

		let file = file_input.files[0];
		let reader = new FileReader();

		reader.onload = function(e) {
			try {
				// Convertir le contenu du fichier en base64
				const base64Content = btoa(
					new Uint8Array(e.target.result)
						.reduce((data, byte) => data + String.fromCharCode(byte), '')
				);

				frappe.call({
					method: 'erpnext.erpnext_integrations.page.import_csv.import_csv.import_fichier_1',
					args: {
						file_content: base64Content
					},
					freeze: true,
					freeze_message: __('Importation en cours...'),
					callback: function(r) {
						if (r.message && r.message.success) {
							frappe.show_alert({
								message: __('Importation réussie'),
								indicator: 'green'
							});
							file_input.value = '';
						} else {
							frappe.throw(r.message.message || __('Erreur lors de l\'importation'));
						}
					}
				});
			} catch(error) {
				frappe.throw(__('Erreur lors de l\'importation du fichier: {0}', [error.message]));
			}
		};

		reader.onerror = function(error) {
			frappe.throw(__('Erreur lors de la lecture du fichier: {0}', [error.message]));
		};

		reader.readAsArrayBuffer(file);
	});

	// Gérer le drag & drop
	const dropZone = import_form.find('.file-upload-zone');
	
	dropZone.on('dragover', function(e) {
		e.preventDefault();
		e.stopPropagation();
		$(this).css('background-color', '#ebf8ff');
	});

	dropZone.on('dragleave', function(e) {
		e.preventDefault();
		e.stopPropagation();
		$(this).css('background-color', '#f8fafc');
	});

	dropZone.on('drop', function(e) {
		e.preventDefault();
		e.stopPropagation();
		$(this).css('background-color', '#f8fafc');
	});

	// Gérer le téléchargement du modèle
	import_form.find('#download-template').on('click', function(e) {
		e.preventDefault();
		const template = 'date,item_name,item_groupe,required_by,quantity,purpose,target_warehouse,ref\n';
		const blob = new Blob([template], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'template_import.csv';
		
		document.body.appendChild(a);
		a.click();
		
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	});
}