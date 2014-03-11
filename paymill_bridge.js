jQuery(document).ready(function($) {
    var settings = Drupal.settings.paymill_payment;
    window.PAYMILL_PUBLIC_KEY = settings.public_key;

    var responseHandler = function(error, result) {
        if (error) {
            errorHandler(error);
        } else {
            settings.$form.find('.paymill-payment-token')
                .val(result.token);
            settings.$form.get(0).submit();
        }
    };

    var errorHandler = function(error) {
        // @TODO: Should also be visible if there's no other message.
        $('<div class="messages error">' + error.apierror + '</div>')
            .appendTo("#messages .section");
        console.log(error);
    }

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

        // @TODO: Add a spinner here.
        event.preventDefault();

        var getField = function(name) {
            if (name instanceof Array) { name = name.join(']['); }
            return $(
                '[name="submitted[paymethod_select][payment_method_all_forms][' +
                    controller + '][' + name + ']"]');
        };

        if (controller === 'Drupalpaymill-paymentCreditCardController') {
            params = {
                number:     getField('credit_card_number').val(),
                exp_month:  getField(['expiry_date', 'month']).val(),
                exp_year:   getField(['expiry_date', 'year']).val(),
                cvc:        getField('secure_code').val(),
            };
        } else if (controller === 'Drupalpaymill-paymentAccountController') {
            var type = getField('account_or_ibanbic').filter(':checked').val();
            if (type === 'account') {
                params = {
                    accountholder:  getField('holder').val(),
                    number:         getField(['account', 'account']).val(),
                    bank:           getField(['account', 'bank_code']).val(),
                };
            } else {
                params = {
                    accountholder:  getField('holder').val(),
                    iban:           getField(['ibanbic', 'iban']).val(),
                    bic:            getField(['ibanbic', 'bic']).val(),
                };
            }
        }
        window.paymill.createToken(params, responseHandler);
    });
});


