<?php

namespace Drupal\paymill_payment;

class CreditCardController extends CommonController implements \Drupal\webform_paymethod_select\PaymentRecurrentController {

  public function __construct() {
    parent::__construct();
    $this->title = t('Paymill Credit Card');
  }

  public function paymentForm() {
    return new PaymillCreditCardForm();
  }

}
