frappe.pages['reset_data'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
	  parent: wrapper,
	  title: 'Réinitialisation des données',
	  single_column: true
	});
  
	// Ajouter une icône et un sous-titre
	const iconHtml = `<i class="fa fa-refresh" style="font-size: 1.2em; color: var(--primary);"></i>`;
	const titleHtml = `${iconHtml} <span style="margin-left: 10px; font-weight: 600; font-size: 1.5em;">Réinitialisation des données</span>`;
	$(page.title_area).html(titleHtml);
  
	// Ajouter une description
	page.add_field({
	  fieldtype: 'HTML',
	  fieldname: 'description',
	  options: `
		<div class="alert alert-warning" style="margin-top: 15px;">
		  <i class="fa fa-exclamation-triangle"></i>
		  <span style="margin-left: 10px; font-weight: bold;">Attention</span>
		  <p style="margin-top: 5px;">Cette opération supprimera toutes les données transactionnelles de votre système et ne peut pas être annulée. Utilisez cette fonction uniquement dans un environnement de test ou après avoir effectué une sauvegarde complète.</p>
		</div>
	  `
	});
  
	// Ajouter une section pour les détails
	let details_section = $(`
	  <div class="section-head" style="margin-top: 25px;">
		<h3><i class="fa fa-info-circle"></i> Détails de la réinitialisation</h3>
	  </div>
	  <div class="section-body" style="margin-bottom: 25px;">
		<div class="row">
		  <div class="col-sm-12">
			<ul style="list-style-type: none; padding-left: 10px;">
			  <li style="margin-bottom: 10px;"><i class="fa fa-check text-success"></i> Les tables configurées comme protégées ne seront pas touchées</li>
			  <li style="margin-bottom: 10px;"><i class="fa fa-check text-success"></i> Toutes les données transactionnelles seront supprimées</li>
			  <li style="margin-bottom: 10px;"><i class="fa fa-check text-success"></i> Les séquences seront réinitialisées à 1</li>
			  <li style="margin-bottom: 10px;"><i class="fa fa-check text-success"></i> Les compteurs de séries seront remis à zéro</li>
			</ul>
		  </div>
		</div>
	  </div>
	`).appendTo(page.body);
  
	// Bouton de réinitialisation avec style amélioré
	let reset_button = $(`
	  <div class="row" style="margin-top: 15px;">
		<div class="col-sm-12 text-center">
		  <button class="btn btn-danger btn-lg" style="padding: 12px 24px; border-radius: 4px;">
			<i class="fa fa-refresh fa-spin"></i> Réinitialiser toutes les données
		  </button>
		</div>
	  </div>
	`).appendTo(page.body);
  
	// Conteneur pour afficher les résultats
	let results_container = $(`
	  <div class="results-container" style="margin-top: 30px; display: none;">
		<div class="section-head">
		  <h3><i class="fa fa-list-alt"></i> Résultats de la réinitialisation</h3>
		</div>
		<div class="section-body reset-results">
		  <div class="reset-message alert" style="white-space: pre-wrap;"></div>
		</div>
	  </div>
	`).appendTo(page.body);
  
	// Gérer le clic sur le bouton de réinitialisation
	reset_button.find('button').on('click', function() {
	  frappe.confirm(
		'Êtes-vous sûr de vouloir réinitialiser toutes les données? Cette opération ne peut pas être annulée.',
		function() {
		  // L'utilisateur a confirmé
		  const btn = reset_button.find('button');
		  btn.prop('disabled', true);
		  btn.html('<i class="fa fa-refresh fa-spin"></i> Réinitialisation en cours...');
		  
		  frappe.call({
			method: 'erpnext.erpnext_integrations.reset_data.reset_data',
			freeze: true,
			freeze_message: 'Réinitialisation des données en cours, veuillez patienter...',
			callback: function(r) {
			  // Réactiver le bouton
			  btn.prop('disabled', false);
			  btn.html('<i class="fa fa-refresh"></i> Réinitialiser toutes les données');
			  
			  // Afficher les résultats
			  results_container.show();
			  
			  // Formater le message
			  const message = r.message;
			  const resultDiv = results_container.find('.reset-message');
			  
			  if (message.includes("Réinitialisation terminée")) {
				resultDiv.removeClass('alert-danger').addClass('alert-success');
				resultDiv.html(`<i class="fa fa-check-circle"></i> ${message}`);
			  } else {
				resultDiv.removeClass('alert-success').addClass('alert-danger');
				resultDiv.html(`<i class="fa fa-times-circle"></i> ${message}`);
			  }
			  
			  // Défiler jusqu'aux résultats
			  $('html, body').animate({
				scrollTop: results_container.offset().top
			  }, 1000);
			},
			error: function(err) {
			  // Réactiver le bouton
			  btn.prop('disabled', false);
			  btn.html('<i class="fa fa-refresh"></i> Réinitialiser toutes les données');
			  
			  // Afficher l'erreur
			  results_container.show();
			  const resultDiv = results_container.find('.reset-message');
			  resultDiv.removeClass('alert-success').addClass('alert-danger');
			  resultDiv.html(`<i class="fa fa-times-circle"></i> Une erreur s'est produite: ${err.message}`);
			}
		  });
		}
	  );
	});
  
	// Arrêter l'animation au chargement de la page
	reset_button.find('.fa-spin').removeClass('fa-spin');
};
  