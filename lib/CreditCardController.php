<?php

namespace Drupal\paymill_payment;

class CreditCardController extends \Drupal\paymill_payment\CommonController implements \Drupal\webform_paymethod_select\PaymentRecurrentController {
  public function __construct() {
    parent::__construct();

    $this->title = t('Paymill Credit Card');
    $this->form = new \Drupal\paymill_payment\PaymillCreditCardForm();
  }
}
