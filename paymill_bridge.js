jQuery(document).ready(function($) {
    var settings = Drupal.settings.paymill_payment;
    window.PAYMILL_PUBLIC_KEY = settings.public_key;

    var getField = function(name) {
        return $('[name="' + settings.form_name + '[' + name + ']"]');
    };

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
        // @TODO: Add a spinner here.
        event.preventDefault();
        settings.$form = $(event.target);
        window.paymill.createToken({
            number:     getField('credit_card_number').val(),
            exp_month:  getField('expiry_date').val().substr(0,2),
            exp_year:   '20' + getField('expiry_date').val().substr(2,3),
            cvc:        getField('secure_code').val(),
            amount_int: settings.amount,
            currency:   settings.currency_code,
            // cardholder:     $('.card-holdername').val()
        }, responseHandler);
    });

});


