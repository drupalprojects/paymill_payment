<?php

namespace Drupal\paymill_payment;

class AccountController extends CommonController implements \Drupal\webform_paymethod_select\PaymentRecurrentController {

  public function __construct() {
    parent::__construct();
    $this->title = t('Paymill Direct Debit');
  }

  public function paymentForm() {
    return new PaymillAccountForm();
  }

}
