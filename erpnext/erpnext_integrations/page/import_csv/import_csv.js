frappe.pages['import-csv'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Import/Export des données dans le format csv',
		single_column: true
	});

	// Créer les sections principales
	let import_section1 = $('<div class="import-section"></div>').appendTo(page.main);
	let export_section1 = $('<div class="export-section" style="margin-top: 30px;"></div>').appendTo(page.main);
	let import_section2 = $('<div class="import-section" style="margin-top: 30px;"></div>').appendTo(page.main);
	let export_section2 = $('<div class="export-section" style="margin-top: 30px;"></div>').appendTo(page.main);

	// Section 1: Premier import
	let section_title1 = $('<h6 class="form-section-heading uppercase">Import Material Request</h6>').appendTo(import_section1);

	// Créer le premier input file directement
	let file_input1 = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner un fichier CSV pour Material Request</label>
			<input type="file" class="form-control" accept=".csv"/>
		</div>
	`).appendTo(import_section1);

	// Ajouter une section pour les boutons du premier import
	let button_section1 = $('<div class="frappe-list-toolbar"></div>').appendTo(import_section1);

	// Boutons pour le premier import
	let import_btn1 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('upload', 'sm')}
			Import Material Request
		</button>
	`).appendTo(button_section1);

	let template_btn1 = $(`
		<button class="btn btn-default btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Télécharger le modèle
		</button>
	`).appendTo(button_section1);

	// Section Export Material Request
	let export_title1 = $('<h6 class="form-section-heading uppercase">Export Material Request</h6>').appendTo(export_section1);
	
	// Ajouter le sélecteur de Material Request
	let mr_select_container = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner les Material Requests à exporter</label>
			<div class="awesomplete">
				<select class="form-control" multiple>
				</select>
			</div>
		</div>
	`).appendTo(export_section1);

	// Bouton d'export pour Material Request
	let export_button_section1 = $('<div class="frappe-list-toolbar"></div>').appendTo(export_section1);
	let export_btn1 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Exporter Material Request
		</button>
	`).appendTo(export_button_section1);

	// Section 2: Deuxième import
	let section_title2 = $('<h6 class="form-section-heading uppercase">Import Supplier</h6>').appendTo(import_section2);

	// Créer le deuxième input file directement
	let file_input2 = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner un fichier CSV pour Supplier</label>
			<input type="file" class="form-control" accept=".csv"/>
		</div>
	`).appendTo(import_section2);

	// Ajouter une section pour les boutons du deuxième import
	let button_section2 = $('<div class="frappe-list-toolbar"></div>').appendTo(import_section2);

	// Boutons pour le deuxième import
	let import_btn2 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('upload', 'sm')}
			Import Supplier
		</button>
	`).appendTo(button_section2);

	let template_btn2 = $(`
		<button class="btn btn-default btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Télécharger le modèle
		</button>
	`).appendTo(button_section2);

	// Section Export Supplier
	let export_title2 = $('<h6 class="form-section-heading uppercase">Export Supplier</h6>').appendTo(export_section2);
	
	// Ajouter le sélecteur de Supplier
	let supplier_select_container = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner les Suppliers à exporter</label>
			<div class="awesomplete">
				<select class="form-control" multiple>
				</select>
			</div>
		</div>
	`).appendTo(export_section2);

	// Bouton d'export pour Supplier
	let export_button_section2 = $('<div class="frappe-list-toolbar"></div>').appendTo(export_section2);
	let export_btn2 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Exporter Supplier
		</button>
	`).appendTo(export_button_section2);

	// Fonction pour charger les Material Requests
	function load_material_requests() {
		frappe.db.get_list('Material Request', {
			fields: ['name', 'transaction_date', 'material_request_type'],
			limit: 0
		}).then(records => {
			let select = mr_select_container.find('select');
			select.empty();
			records.forEach(record => {
				select.append(
					$('<option></option>')
						.attr('value', record.name)
						.text(`${record.name} - ${record.material_request_type} (${record.transaction_date})`)
				);
			});
		});
	}

	// Fonction pour charger les Suppliers
	function load_suppliers() {
		frappe.db.get_list('Supplier', {
			fields: ['name', 'supplier_name', 'supplier_type'],
			limit: 0
		}).then(records => {
			let select = supplier_select_container.find('select');
			select.empty();
			records.forEach(record => {
				select.append(
					$('<option></option>')
						.attr('value', record.name)
						.text(`${record.supplier_name} - ${record.supplier_type}`)
				);
			});
		});
	}

	// Charger les données initiales
	load_material_requests();
	load_suppliers();

	// Gérer l'export des Material Requests
	export_btn1.on('click', function() {
		let selected_mrs = mr_select_container.find('select').val();
		if (!selected_mrs || selected_mrs.length === 0) {
			frappe.throw(__('Veuillez sélectionner au moins un Material Request'));
			return;
		}

		frappe.call({
			method: 'erpnext.erpnext_integrations.page.import_csv.export_csv.export_fichier_1',
			args: {
				material_request_names: selected_mrs
			},
			freeze: true,
			freeze_message: __('Export en cours...'),
			callback: function(r) {
				if (r.message && r.message.success) {
					// Créer et télécharger le fichier
					const content = atob(r.message.content);
					const blob = new Blob([content], { type: 'text/csv' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.style.display = 'none';
					a.href = url;
					a.download = r.message.filename;

					document.body.appendChild(a);
					a.click();

					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);

					frappe.show_alert({
						message: __('Export réussi'),
						indicator: 'green'
					});
				} else {
					frappe.throw(r.message.message || __('Erreur lors de l\'export'));
				}
			}
		});
	});

	// Gérer l'export des Suppliers
	export_btn2.on('click', function() {
		let selected_suppliers = supplier_select_container.find('select').val();
		if (!selected_suppliers || selected_suppliers.length === 0) {
			frappe.throw(__('Veuillez sélectionner au moins un Supplier'));
			return;
		}

		frappe.call({
			method: 'erpnext.erpnext_integrations.page.import_csv.export_csv.export_fichier_2',
			args: {
				supplier_names: selected_suppliers
			},
			freeze: true,
			freeze_message: __('Export en cours...'),
			callback: function(r) {
				if (r.message && r.message.success) {
					// Créer et télécharger le fichier
					const content = atob(r.message.content);
					const blob = new Blob([content], { type: 'text/csv' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.style.display = 'none';
					a.href = url;
					a.download = r.message.filename;

					document.body.appendChild(a);
					a.click();

					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);

					frappe.show_alert({
						message: __('Export réussi'),
						indicator: 'green'
					});
				} else {
					frappe.throw(r.message.message || __('Erreur lors de l\'export'));
				}
			}
		});
	});

	// Gérer le clic sur le premier bouton d'importation
	import_btn1.on('click', function () {
		let file_input = file_input1.find('input[type="file"]')[0];
		if (!file_input.files || !file_input.files.length) {
			frappe.throw(__('Veuillez sélectionner un fichier CSV'));
			return;
		}

		let file = file_input.files[0];
		let reader = new FileReader();

		reader.onload = function (e) {
			let content = e.target.result;
			// Convertir le contenu en base64
			let base64Content = btoa(content);

			frappe.call({
				method: 'erpnext.erpnext_integrations.page.import_csv.import_csv.import_fichier_1',
				args: {
					file_content: base64Content
				},
				freeze: true,
				freeze_message: __('Importation en cours...'),
				callback: function (r) {
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
		};

		reader.onerror = function () {
			frappe.throw(__('Erreur lors de la lecture du fichier'));
		};

		reader.readAsBinaryString(file);
	});

	// Gérer le clic sur le deuxième bouton d'importation
	import_btn2.on('click', function () {
		let file_input = file_input2.find('input[type="file"]')[0];
		if (!file_input.files || !file_input.files.length) {
			frappe.throw(__('Veuillez sélectionner un fichier CSV'));
			return;
		}

		let file = file_input.files[0];
		let reader = new FileReader();

		reader.onload = function (e) {
			let content = e.target.result;
			// Convertir le contenu en base64
			let base64Content = btoa(content);

			frappe.call({
				method: 'erpnext.erpnext_integrations.page.import_csv.import_csv.import_fichier_2',
				args: {
					file_content: base64Content
				},
				freeze: true,
				freeze_message: __('Importation en cours...'),
				callback: function (r) {
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
		};

		reader.onerror = function () {
			frappe.throw(__('Erreur lors de la lecture du fichier'));
		};

		reader.readAsBinaryString(file);
	});

	// Gérer le téléchargement du premier modèle
	template_btn1.on('click', function () {
		const template = 'date,item_name,item_groupe,required_by,quantity,purpose,target_warehouse,ref\n' +
			'2025-01-01,item exemple,categorie exemple,2025-01-02,10,Purchase,All Warehouses - ITU,MAT-MR-2025-00001\n' +
			'2025-01-01,autre item,autre categorie,2025-01-02,5,Material Transfer,All Warehouses - ITU,MAT-MR-2025-00002\n';
		const blob = new Blob([template], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'template_material_request.csv';

		document.body.appendChild(a);
		a.click();

		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	});

	// Gérer le téléchargement du deuxième modèle
	template_btn2.on('click', function () {
		const template = 'supplier_name,country,type\n' +
			'Fournisseur Exemple,Madagascar,Local\n' +
			'Another Supplier,United States,Overseas\n';
		const blob = new Blob([template], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'template_supplier.csv';

		document.body.appendChild(a);
		a.click();

		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	});

	// Ajouter un peu d'espace entre les éléments
	page.main.find('.import-section, .export-section').css('padding', '20px');
	page.main.find('.frappe-list-toolbar').css('margin-top', '15px');
	page.main.find('.frappe-list-toolbar button').css('margin-right', '10px');
}