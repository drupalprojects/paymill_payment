(function ($) {
Drupal.behaviors.paymill_payment = {
  attach: function(context, settings) {
    var self = this;

    if (typeof window.paymill === 'undefined') {
        $.getScript('https://bridge.paymill.com/').done(function() {
            self.attach();
        });
    }

    if ($('.mo-dialog-wrapper').length === 0) {
      $('<div class="mo-dialog-wrapper"><div class="mo-dialog-content"></div></div>').appendTo('body');
    }

    $('.webform-client-form #payment-method-all-forms').each(function() {
      var $form = $(this).closest('form.webform-client-form');
      var form_num = $form.attr('id').split('-')[3];
      var $button = $form.find('#edit-webform-ajax-submit-' + form_num);

      if ($button.length === 0) { // no webform_ajax.
        $button = $form.find('input.form-submit');
      }
      $button.unbind('click');
      $button.click(self.submitHandler);
    });
  },

  submitHandler: function(event) {
    var $form = $(event.target).closest('form');
    var params;
    var self = Drupal.behaviors.paymill_payment;
    var $method = $form.find('.payment-method-form:visible');
    var controller = $method.attr('id');
    self.$form = $form;
    self.$method = $method;
    self.settings = Drupal.settings.paymill_payment['pmid-' + $method.data('pmid')];

    // Some non-paymill method was selected, do nothing on submit.
    if (controller !== 'Drupalpaymill-paymentCreditCardController' && controller !== 'Drupalpaymill-paymentAccountController') {
      return true;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    $('.mo-dialog-wrapper').addClass('visible');

    var getField = function(name) {
      if (name instanceof Array) { name = name.join(']['); }
      return $method.find('[name$="[' + name + ']"]');
    };

    window.PAYMILL_PUBLIC_KEY = self.settings.public_key;
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
      var ajax, button_id;
      if (error) {
        self.errorHandler(error);
      } else {
        $form.find('.paymill-payment-token').val(result.token);
        button_id = $(event.target).attr('id');

        if (Drupal.ajax && Drupal.ajax[button_id]) {
          ajax = Drupal.ajax[button_id];
          ajax.eventResponse(ajax.element, event);
        } else { // no webform_ajax
          $form.submit();
        }
      }
    });
    return false;
  },

  errorHandler: function(error) {
    var $method = this.$method;
    var $form = this.$form;
    var settings = this.settings;
    var form_id = $form.attr('id');
    var msg;
    if (typeof error.message === 'undefined') {
      msg = settings.error_messages[error.apierror];
    } else {
      msg = error.message;
    }
    var settings, wrapper, child;
    if (typeof Drupal.clientsideValidation !== 'undefined') {
      settings = Drupal.settings.clientsideValidation.forms[form_id];
      wrapper = document.createElement(settings.general.wrapper);
      child = document.createElement(settings.general.errorElement);
      child.className = settings.general.errorClass;
      child.innerHTML = msg;
      wrapper.appendChild(child);

	  $('#clientsidevalidation-' + form_id + '-errors ul')
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
    console.error(error, msg);
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
