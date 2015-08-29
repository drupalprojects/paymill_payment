(function ($) {
Drupal.behaviors.paymill_payment = {
  attach: function(context, settings) {
    var self = this;

    if ($('.paymill-payment-token', context).length > 0) {
      this.settings = settings.paymill_payment;
      if (!Drupal.payment_handler) {
        Drupal.payment_handler = {};
      }
      for (var pmid in settings.paymill_payment) {
        if (pmid.slice(0, 5) == 'pmid-') {
          Drupal.payment_handler[pmid.slice(5)] = function(pmid, $method, submitter) {
            self.validateHandler(pmid, $method, submitter);
          };
        }
      }
    }
  },

  validateHandler: function(pmid, $method, submitter) {
    var settings = this.settings['pmid-' + pmid];

    var getField = function(name) {
      if (name instanceof Array) { name = name.join(']['); }
      return $method.find('[name$="[' + name + ']"]');
    };

    var params;
    window.PAYMILL_PUBLIC_KEY = settings.public_key;
    if (settings.method == 'credit_card') {
      params = {
        number:     getField('credit_card_number').val(),
        exp_month:  getField(['expiry_date', 'month']).val(),
        exp_year:   getField(['expiry_date', 'year']).val(),
        cvc:        getField('secure_code').val(),
      };
      if (!this.validateCreditCard(params)) {
        submitter.error();
        return;
      }
    }
    else if (settings.method == 'account') {
      params = {
        accountholder: getField('holder').val(),
        iban:          getField(['ibanbic', 'iban']).val(),
        bic:           getField(['ibanbic', 'bic']).val(),
      };
      if (!this.validateIbanBic(params)) {
        submitter.error();
        return;
      }
    }

    var self = this;
    window.paymill.createToken(params, function(error, result) {
      if (error) {
        self.errorHandler(error);
        submitter.error();
      } else {
        $method.find('.paymill-payment-token').val(result.token);
        submitter.ready();
      }
    });
  },

  errorHandler: function(error) {
    var form_id = this.$form.attr('id');
    var msg;
    if (typeof error.message === 'undefined') {
      msg = this.settings.error_messages[error.apierror];
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

    return number && expiry && cvc;
  },

  validateIbanBic: function(p) {
    var holder = window.paymill.validateHolder(p.accountholder);
    var iban   = window.paymill.validateIban(p.iban);
    var bic    = window.paymill.validateBic(p.bic);
    if (!holder) { this.errorHandler('field_invalid_account_holder'); }
    if (!iban)   { this.errorHandler('field_invalid_iban'); }
    if (!bic)    { this.errorHandler('field_invalid_bic'); }

    return holder && iban && bic;
  }
};

}(jQuery));
