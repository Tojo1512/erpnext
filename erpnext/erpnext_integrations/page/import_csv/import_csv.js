frappe.pages['import-csv'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Import des données dans le format csv',
		single_column: true
	});

	// Créer les sections principales
	let import_section1 = $('<div class="import-section"></div>').appendTo(page.main);
	let import_section2 = $('<div class="import-section" style="margin-top: 30px;"></div>').appendTo(page.main);

	// Section 1: Premier import
	let section_title1 = $('<h6 class="form-section-heading uppercase">Import 1</h6>').appendTo(import_section1);

	// Créer le premier input file directement
	let file_input1 = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner un fichier CSV pour 1</label>
			<input type="file" class="form-control" accept=".csv"/>
		</div>
	`).appendTo(import_section1);

	// Ajouter une section pour les boutons du premier import
	let button_section1 = $('<div class="frappe-list-toolbar"></div>').appendTo(import_section1);

	// Boutons pour le premier import
	let import_btn1 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('upload', 'sm')}
			Import 1
		</button>
	`).appendTo(button_section1);

	let template_btn1 = $(`
		<button class="btn btn-default btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Télécharger le modèle
		</button>
	`).appendTo(button_section1);

	// Section 2: Deuxième import
	let section_title2 = $('<h6 class="form-section-heading uppercase">Import 2</h6>').appendTo(import_section2);

	// Créer le deuxième input file directement
	let file_input2 = $(`
		<div class="form-group">
			<label class="control-label">Sélectionner un fichier CSV pour 2</label>
			<input type="file" class="form-control" accept=".csv"/>
		</div>
	`).appendTo(import_section2);

	// Ajouter une section pour les boutons du deuxième import
	let button_section2 = $('<div class="frappe-list-toolbar"></div>').appendTo(import_section2);

	// Boutons pour le deuxième import
	let import_btn2 = $(`
		<button class="btn btn-primary btn-sm">
			${frappe.utils.icon('upload', 'sm')}
			Import 2
		</button>
	`).appendTo(button_section2);

	let template_btn2 = $(`
		<button class="btn btn-default btn-sm">
			${frappe.utils.icon('download', 'sm')}
			Télécharger le modèle
		</button>
	`).appendTo(button_section2);

	// Gérer le clic sur le premier bouton d'importation
	import_btn1.on('click', function() {
		let file_input = file_input1.find('input[type="file"]')[0];
		if (!file_input.files || !file_input.files.length) {
			frappe.throw(__('Veuillez sélectionner un fichier CSV'));
			return;
		}

		let file = file_input.files[0];
		let reader = new FileReader();

		reader.onload = function(e) {
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
		};

		reader.onerror = function() {
			frappe.throw(__('Erreur lors de la lecture du fichier'));
		};

		reader.readAsBinaryString(file);
	});

	// Gérer le clic sur le deuxième bouton d'importation
	import_btn2.on('click', function() {
		let file_input = file_input2.find('input[type="file"]')[0];
		if (!file_input.files || !file_input.files.length) {
			frappe.throw(__('Veuillez sélectionner un fichier CSV'));
			return;
		}

		let file = file_input.files[0];
		let reader = new FileReader();

		reader.onload = function(e) {
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
		};

		reader.onerror = function() {
			frappe.throw(__('Erreur lors de la lecture du fichier'));
		};

		reader.readAsBinaryString(file);
	});

	// Gérer le téléchargement du premier modèle
	template_btn1.on('click', function() {
		const template = 'date,item_name,item_groupe,required_by,quantity,purpose,target_warehouse,ref\n';
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
	template_btn2.on('click', function() {
		const template = 'supplier_name,country,type\n';
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
	page.main.find('.import-section').css('padding', '20px');
	page.main.find('.frappe-list-toolbar').css('margin-top', '15px');
	page.main.find('.frappe-list-toolbar button').css('margin-right', '10px');
}