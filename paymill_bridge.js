  (function ($) {
Drupal.behaviors.paymill_payment = {
  attach: function(context, settings) {
    var self = this;

    if (typeof self.settings === 'undefined') {
      self.$form = $('.webform-client-form #payment-method-all-forms')
	.closest('form.webform-client-form');
      // the current webform page, does not contain a paymethod-selector.
      if (!self.$form.length) { return; }
      self.form_id = self.$form.attr('id');
      self.form_num = self.form_id.split('-')[3];
      self.pmid = self.$form.find('.payment-method-form').attr('data-pmid');
      self.settings = settings.paymill_payment[self.pmid];
    }


    if (typeof window.paymill === 'undefined') {
        $.getScript('https://bridge.paymill.com/').done(function() {
            self.attach();
        });
    }

    if ($('.mo-dialog-wrapper').length === 0) {
      $('<div class="mo-dialog-wrapper"><div class="mo-dialog-content">' +
	'</div></div>').appendTo('body');
    }
    
    window.PAYMILL_PUBLIC_KEY = self.settings.public_key;

    self.$button = self.$form.find('#edit-webform-ajax-submit-' + self.form_num);

    if (self.$button.length === 0) { // no webform_ajax.
      self.$button = $form.find('input.form-submit');
    }
    self.$button.unbind('click');
    self.$button.click(self.submitHandler);
  },

  submitHandler: function(event) {
    var params;
    var self = Drupal.behaviors.paymill_payment;
    var controller = self.$form.find('.payment-method-form:visible').attr('id');

    // Some non-paymill method was selected, do nothing on submit.
    if (controller !== 'Drupalpaymill-paymentCreditCardController' && controller !== 'Drupalpaymill-paymentAccountController') {
      return true;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    $('.mo-dialog-wrapper').addClass('visible');

    var getField = function(name) {
      if (name instanceof Array) { name = name.join(']['); }
      return $('[name="submitted[paymethod_select]' + '[payment_method_all_forms][' + controller + '][' + name + ']"]');
    };

    if (controller === 'Drupalpaymill-paymentCreditCardController') {
      params = {
        number:     getField('credit_card_number').val(),
        exp_month:  getField(['expiry_date', 'month']).val(),
        exp_year:   getField(['expiry_date', 'year']).val(),
        cvc:        getField('secure_code').val(),
      };
      if (!self.validateCreditCard(params)) { return; }

    } else if (controller === 'Drupalpaymill-paymentAccountController') {
      params = {
        accountholder: getField('holder').val(),
        iban:          getField(['ibanbic', 'iban']).val(),
        bic:           getField(['ibanbic', 'bic']).val(),
      };
      if (!self.validateIbanBic(params)) { return; }
    }

    window.paymill.createToken(params, function(error, result) {
      var self = Drupal.behaviors.paymill_payment;
      var ajax, ajax_next, ajax_submit;
      if (error) {
        self.errorHandler(error.apierror);
      } else {
        self.$form.find('.paymill-payment-token').val(result.token);
        ajax_next = 'edit-webform-ajax-next-'+self.form_num;
        ajax_submit = 'edit-webform-ajax-submit-'+self.form_num;

        if (Drupal.ajax && Drupal.ajax[ajax_submit]) {
          ajax = Drupal.ajax[ajax_submit];
          ajax.eventResponse(ajax.element, event);
        } else if (Drupal.ajax && Drupal.ajax[ajax_next]) {
          ajax = Drupal.ajax[ajax_next];
          ajax.eventResponse(ajax.element, event);
        } else { // no webform_ajax
          self.$form.submit();
        }
      }
    });
    return false;
  },

  errorHandler: function(error) {
    var self = Drupal.behaviors.paymill_payment;
    var msg = self.settings.error_messages[error];
    var settings, wrapper, child;
	if (typeof Drupal.clientsideValidation !== 'undefined') {
	  settings = Drupal.settings.clientsideValidation.forms[self.form_id];
	  wrapper = document.createElement(settings.general.wrapper);
	  child = document.createElement(settings.general.errorElement);
	  child.className = settings.general.errorClass;
	  child.innerHTML = msg;
	  wrapper.appendChild(child);

	  $('#clientsidevalidation-' + self.form_id + '-errors ul')
	    .append(wrapper).show()
		.parent().show();
    } else {
        if ($('#messages').length === 0) {
            $('<div id="messages"><div class="section clearfix"></div></div>')
                .insertAfter('#header');
        }
        $('<div class="messages error">' + msg + '</div>')
            .appendTo("#messages .clearfix");
    }
    console.error(msg);
  },

  validateCreditCard: function(p) {
    var number = window.paymill.validateCardNumber(p.number);
    var expiry = window.paymill.validateExpiry(p.exp_month, p.exp_year);
    var cvc    = window.paymill.validateCvc(p.cvc);
    if (!number) { this.errorHandler('field_invalid_card_number'); }
    if (!expiry) { this.errorHandler('field_invalid_card_exp'); }
    if (!cvc)    { this.errorHandler('field_invalid_card_cvc'); }

    if (number && expiry && cvc) { return true; }
    else { return false; }
  },

  validateIbanBic: function(p) {
    var holder = window.paymill.validateHolder(p.accountholder);
    var iban   = window.paymill.validateIban(p.iban);
    var bic    = window.paymill.validateBic(p.bic);
    if (!holder) { this.errorHandler('field_invalid_account_holder'); }
    if (!iban)   { this.errorHandler('field_invalid_iban'); }
    if (!bic)    { this.errorHandler('field_invalid_bic'); }

    if (holder && iban && bic) { return true; }
    else { return false; }
  }
};

}(jQuery));
