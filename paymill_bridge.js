jQuery(document).ready(function($) {
    var t = Drupal.t;
    var settings = Drupal.settings.paymill_payment;
    window.PAYMILL_PUBLIC_KEY = settings.public_key;

    var errorHandler = function(message) {
        if ($('#messages').length === 0) {
            $('<div id="messages"><div class="section clearfix">' +
              '</div></div>').insertAfter('#header');
        }
        $('<div class="messages error">' + message + '</div>')
            .appendTo("#messages .section");
        console.error(message);
    };

    var responseHandler = function(error, result) {
        if (error) {
            errorHandler(t('Paymill error: @error',
                           {'@error': error.apierror}));
        } else {
            settings.$form.find('.paymill-payment-token')
                .val(result.token);
            settings.$form.get(0).submit();
        }
    };

    var validateAmount = function(value) {
        var amount = paymill.validateAmount(value);
        if (!amount) { errorHandler(t('Invalid amount.')); };
        return amount;
    };

    var validateCreditCard = function(p) {
        var number = paymill.validateCardNumber(p.number),
            expiry = paymill.validateExpiry(p.exp_month, p.exp_year),
            cvc    = paymill.validateCvc(p.cvc);
        if (!number) { errorHandler(t('Invalid creditcard number.')); };
        if (!expiry) { errorHandler(t('Invalid expiry date.')); };
        if (!cvc)    { errorHandler(t('Invalid CVC.')); };

        if (number && expiry && cvc) { return true; }
        else { return false; };
    };

    var validateAccount = function(p) {
        var holder = paymill.validateHolder(p.accountholder),
            number = paymill.validateAccountNumber(p.number),
            bank   = paymill.validateBankCode(p.bank);
        if (!holder) { errorHandler(t('Invalid account holder.')); };
        if (!number) { errorHandler(t('Invalid account number.')); };
        if (!bank)   { errorHandler(t('Invalid bank code.')); };

        if (holder && number && bank) { return true; }
        else { return false; };
    };

    var validateIbanBic = function(p) {
        var holder = paymill.validateHolder(p.accountholder),
            iban   = paymill.validateIban(p.iban),
            bic    = paymill.validateBic(p.bic);
        if (!holder) { errorHandler(t('Invalid account holder.')); };
        if (!iban)   { errorHandler(t('Invalid IBAN.')); };
        if (!bic)    { errorHandler(t('Invalid BIC.')); };

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


