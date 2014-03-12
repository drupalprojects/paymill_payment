(function ($) {
Drupal.behaviors.paymill_payment = {
    attach: function(context, settings) {
        var self = this;
        self.settings = settings.paymill_payment;
        window.PAYMILL_PUBLIC_KEY = self.settings.public_key;

        self.$form = $('#payment-method-all-forms')
            .closest('form.webform-client-form');
        // the current webform page, does not contain a paymethod-selector.
        if (!self.$form.length) { return; }

        var button = $('#edit-webform-ajax-submit-' + 
                       self.$form.attr('id').split('-')[3]);
        $(self.$form, context).once('paymill_payment', function () {
            button.mousedown(self.submitHandler);
        });
    },

    submitHandler: function(event) {
        var params;
        var self = Drupal.behaviors.paymill_payment;
        var controller = self.$form
            .find('.payment-method-form:visible').attr('id');

        // Some non-paymill method was selected, do nothing on submit.
        if (controller !== 'Drupalpaymill-paymentCreditCardController'
            && controller !== 'Drupalpaymill-paymentAccountController') {
            return
        }
	event.preventDefault();
        event.stopImmediatePropagation();

        // @TODO: Add a spinner here.

        /*if (!self.validateAmount($('#webform-component-donation-amount ' +
                                   ' input').val())) {
            return true;
        }*/

        var getField = function(name) {
            if (name instanceof Array) { name = name.join(']['); }
            return $('[name="submitted[paymethod_select]' +
                     '[payment_method_all_forms][' + controller + '][' +
                     name + ']"]');
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

            var type = getField('account_or_ibanbic')
                .filter(':checked').val();

            if (type === 'account') {
                params = {
                    accountholder:  getField('holder').val(),
                    number:         getField(['account', 'account']).val(),
                    bank:           getField(['account', 'bank_code']).val(),
                };
                if (!self.validateAccount(params)) { return; }

            } else {
                params = {
                    accountholder:  getField('holder').val(),
                    iban:           getField(['ibanbic', 'iban']).val(),
                    bic:            getField(['ibanbic', 'bic']).val(),
                };
                if (!self.validateIbanBic(params)) { return; }

            }
        }
        window.paymill.createToken(params, function(error, result) {
            var self = Drupal.behaviors.paymill_payment;
            if (error) {
                self.errorHandler(error.apierror);
            } else {
                self.$form.find('.paymill-payment-token')
                    .val(result.token);


            }
        });
	return false;
    },

    errorHandler: function(error) {
        var self = Drupal.behaviors.paymill_payment;
        if ($('#messages').length === 0) {
            $('<div id="messages"><div class="section clearfix">' +
              '</div></div>').insertAfter('#header');
        }
        console.log(self.settings, error);
        $('<div class="messages error">' +
          self.settings.error_messages[error] + '</div>')
            .appendTo("#messages .section");
        console.error(self.settings.error_messages[error]);
    },

    validateAmount: function(value) {
        var amount = window.paymill.validateAmountInt(value);
        if (!amount) { this.errorHandler('field_invalid_amount_int'); };
        return amount;
    },

    validateCreditCard: function(p) {
        var number = window.paymill.validateCardNumber(p.number),
            expiry = window.paymill.validateExpiry(p.exp_month, p.exp_year),
            cvc    = window.paymill.validateCvc(p.cvc);
        if (!number) { this.errorHandler('field_invalid_card_number'); };
        if (!expiry) { this.errorHandler('field_invalid_card_exp'); };
        if (!cvc)    { this.errorHandler('field_invalid_card_cvc'); };

        if (number && expiry && cvc) { return true; }
        else { return false; };
    },

    validateAccount: function(p) {
        var holder = window.paymill.validateHolder(p.accountholder),
            number = window.paymill.validateAccountNumber(p.number),
            bank   = window.paymill.validateBankCode(p.bank);
        if (!holder) { this.errorHandler('field_invalid_account_holder'); };
        if (!number) { this.errorHandler('field_invalid_account_number'); };
        if (!bank)   { this.errorHandler('field_invalid_bank_code'); };

        if (holder && number && bank) { return true; }
        else { return false; };
    },

    validateIbanBic: function(p) {
        var holder = window.paymill.validateHolder(p.accountholder),
            iban   = window.paymill.validateIban(p.iban),
            bic    = window.paymill.validateBic(p.bic);
        if (!holder) { this.errorHandler('field_invalid_account_holder'); };
        if (!iban)   { this.errorHandler('field_invalid_iban'); };
        if (!bic)    { this.errorHandler('field_invalid_bic'); };

        if (holder && iban && bic) { return true; }
        else { return false; };
    }
};
}(jQuery));


