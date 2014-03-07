<?php

namespace Drupal\paymill_payment;

module_load_include('php', 'payment_forms', 'lib/CreditCardForm');

class CreditCardController extends \Drupal\paymill_payment\CommonController {
  public function __construct() {
    parent::__construct();

    $this->title = t('Paymill Credit Card');
    $this->form = new \Drupal\paymill_payment\PaymillCreditCardForm();
  }

  public function execute(\Payment $payment) {
    $api_key = $payment->method->controller_data['private_key'];
    $token = $payment->method_data['paymill_payment_token'];
    $request = new \Paymill\Request($api_key);
    $transaction = new \Paymill\Models\Request\Transaction();

    $transaction
      ->setToken($token)
      ->setAmount($payment->totalAmount(0))
      ->setCurrency($payment->currency_code)
      ->setDescription(t('Donation to ' . variable_get('site_name',
            t('an unnamed site'))));
    $response = $request->create($transaction);
    $payment->setStatus(new \PaymentStatusItem(PAYMENT_STATUS_SUCCESS));
  }
}
