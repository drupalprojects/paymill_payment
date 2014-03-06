<?php

namespace Drupal\paymill_payment;

module_load_include('php', 'payment_forms', 'lib/CreditCardForm');

class CreditCardController extends \Drupal\paymill_payment\CommonController {
  public function __construct() {
    parent::__construct();

    $this->title = t('Paymill Credit Card');
    $this->form = new \Drupal\paymill_payment\PaymillCreditCardForm();
  }
  }
}
