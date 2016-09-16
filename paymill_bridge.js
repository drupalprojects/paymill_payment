(function ($) {

// Abstract validator class.
function Validator($method, settings) {
  this.settings = settings;
  this.$method = $method;
}

Validator.prototype.getField = function(name) {
  if (name instanceof Array) { name = name.join(']['); }
  return this.$method.find('[name$="[' + name + ']"]');
};

Validator.prototype.validate = function(submitter) {
  var params = this.getParams();
  window.PAYMILL_PUBLIC_KEY = this.settings.public_key;
  if (!this.methodValidate(params, submitter)) {
    submitter.error();
    return;
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
};

Validator.prototype.errorHandler = function(error) {
  var form_id = this.$method.closest('form').attr('id');
  var msg;
  if (error in Drupal.settings.paymill_payment.error_messages) {
    msg = Drupal.settings.paymill_payment.error_messages[error];
  } else {
    msg = error;
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
};


// Validator for credit card forms.
function CreditCardValidator($method, settings) {
  Validator.call(this, $method, settings);
}
CreditCardValidator.prototype = Object.create(Validator.prototype);

CreditCardValidator.prototype.getParams = function() {
  return {
    number:     this.getField('credit_card_number').val(),
    exp_month:  this.getField(['expiry_date', 'month']).val(),
    exp_year:   this.getField(['expiry_date', 'year']).val(),
    cvc:        this.getField('secure_code').val(),
  };
};

CreditCardValidator.prototype.methodValidate = function(p, submitter) {
  // Avoid shortcut logic.
  var number = window.paymill.validateCardNumber(p.number);
  var expiry = window.paymill.validateExpiry(p.exp_month, p.exp_year);
  var cvc    = window.paymill.validateCvc(p.cvc);
  if (!number) { this.errorHandler('field_invalid_card_number'); }
  if (!expiry) { this.errorHandler('field_invalid_card_exp'); }
  if (!cvc)    { this.errorHandler('field_invalid_card_cvc'); }

  return number && expiry && cvc;
};

// Validator for account forms.
function AccountValidator($method, settings) {
  Validator.call(this, $method, settings);
}
AccountValidator.prototype = Object.create(Validator.prototype);

AccountValidator.prototype.getParams = function() {
  return {
    accountholder: this.getField('holder').val(),
    iban:          this.getField(['ibanbic', 'iban']).val(),
    bic:           this.getField(['ibanbic', 'bic']).val(),
  };
};

AccountValidator.prototype.methodValidate = function(p, submitter) {
  // Avoid shortcut logic.
  var holder = window.paymill.validateHolder(p.accountholder);
  var iban   = window.paymill.validateIban(p.iban);
  var bic    = window.paymill.validateBic(p.bic);
  if (!holder) { this.errorHandler('field_invalid_account_holder'); }
  if (!iban)   { this.errorHandler('field_invalid_iban'); }
  if (!bic)    { this.errorHandler('field_invalid_bic'); }

  return holder && iban && bic;
};


Drupal.behaviors.paymill_payment = {
  attach: function(context, settings) {

    if (!Drupal.payment_handler) {
      Drupal.payment_handler = {};
    }

    $('.paymill-payment-token', context).each(function() {
      var pmid = $(this).data('pmid');
      var s = settings.paymill_payment['pmid-' + pmid];
      if (s) {
        var validator_class = null;
        if (s.method == 'credit_card') {
          validator_class = CreditCardValidator;
        }
        else if (s.method == 'account') {
          validator_class = AccountValidator;
        }
        Drupal.payment_handler[pmid] = function(pmid, $method, submitter) {
          if (validator_class) {
            var validator = new validator_class($method, s);
            validator.validate(submitter);
          }
        };
      }
    });
  },
};

}(jQuery));
