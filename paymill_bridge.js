jQuery(document).ready(function($) {
    var t = Drupal.t;
    var settings = Drupal.settings.paymill_payment;
    window.PAYMILL_PUBLIC_KEY = settings.public_key;


    var errorHandler = function(error) {
        if ($('#messages').length === 0) {
            $('<div id="messages"><div class="section clearfix">' +
              '</div></div>').insertAfter('#header');
        }
        $('<div class="messages error">' +
          settings.error_messages[error][0] + '</div>')
            .appendTo("#messages .section");
        console.error(settings.error_messages[error][0]);
    };

    var responseHandler = function(error, result) {
        if (error) {
            errorHandler(error.apierror);
        } else {
            settings.$form.find('.paymill-payment-token')
                .val(result.token);
            settings.$form.get(0).submit();
        }
    };

    var validateAmount = function(value) {
        var amount = paymill.validateAmountInt(value);
        if (!amount) { errorHandler('field_invalid_amount_int'); };
        return amount;
    };

    var validateCreditCard = function(p) {
        var number = paymill.validateCardNumber(p.number),
            expiry = paymill.validateExpiry(p.exp_month, p.exp_year),
            cvc    = paymill.validateCvc(p.cvc);
        if (!number) { errorHandler('field_invalid_card_number'); };
        if (!expiry) { errorHandler('field_invalid_card_exp'); };
        if (!cvc)    { errorHandler('field_invalid_card_cvc'); };

        if (number && expiry && cvc) { return true; }
        else { return false; };
    };

    var validateAccount = function(p) {
        var holder = paymill.validateHolder(p.accountholder),
            number = paymill.validateAccountNumber(p.number),
            bank   = paymill.validateBankCode(p.bank);
        if (!holder) { errorHandler('field_invalid_account_holder'); };
        if (!number) { errorHandler('field_invalid_account_number'); };
        if (!bank)   { errorHandler('field_invalid_bank_code'); };

        if (holder && number && bank) { return true; }
        else { return false; };
    };

    var validateIbanBic = function(p) {
        var holder = paymill.validateHolder(p.accountholder),
            iban   = paymill.validateIban(p.iban),
            bic    = paymill.validateBic(p.bic);
        if (!holder) { errorHandler('field_invalid_account_holder'); };
        if (!iban)   { errorHandler('field_invalid_iban'); };
        if (!bic)    { errorHandler('field_invalid_bic'); };

        if (holder && iban && bic) { return true; }
        else { return false; };
    };

    $('.webform-client-form').submit(function(event) {
        var params;
        settings.$form = $(event.target);
        var controller = settings.$form.find('.payment-method-form:visible')
            .attr('id');

        // Some non-paymill method was selected, do nothing on submit.
        if (controller !== 'Drupalpaymill-paymentCreditCardController'
            && controller !== 'Drupalpaymill-paymentAccountController') {
            return
        }
        event.preventDefault();

        // @TODO: Add a spinner here.

        if (!validateAmount($('#webform-component-donation-amount ' +
                              ' input').val())) {
            return;
        }

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
            if (!validateCreditCard(params)) { return; }

        } else if (controller === 'Drupalpaymill-paymentAccountController') {

            var type = getField('account_or_ibanbic')
                .filter(':checked').val();

            if (type === 'account') {
                params = {
                    accountholder:  getField('holder').val(),
                    number:         getField(['account', 'account']).val(),
                    bank:           getField(['account', 'bank_code']).val(),
                };
                if (!validateAccount(params)) { return; }

            } else {
                params = {
                    accountholder:  getField('holder').val(),
                    iban:           getField(['ibanbic', 'iban']).val(),
                    bic:            getField(['ibanbic', 'bic']).val(),
                };
                if (!validateIbanBic(params)) { return; }

            }
        }
        window.paymill.createToken(params, responseHandler);
    });
});


