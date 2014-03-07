<?php

namespace Drupal\paymill_payment;

class CreditCardController extends \Drupal\paymill_payment\CommonController {
  public function __construct() {
    parent::__construct();

    $this->title = t('Paymill Credit Card');
    $this->form = new \Drupal\paymill_payment\PaymillCreditCardForm();
  }

  public function execute(\Payment $payment) {
    $context = &$payment->context_data['context'];
    $api_key = $payment->method->controller_data['private_key'];
    $token = $payment->method_data['paymill_payment_token'];
    $request = new \Paymill\Request($api_key);

    $client = new \Paymill\Models\Request\Client();
    $client->setEmail($context->value('email'));
    $client->setDescription(trim(
        $context->value('title') . ' ' .
        $context->value('first_name') . ' ' .
        $context->value('last_name')
      ));
    $client_id = $request->create($client)->getId();

    switch ($context->value('donation_interval')) {
      case 'm': $interval = '1 MONTH'; break;
      case 'y': $interval = '1 YEAR'; break;
      default:  $interval = NULL; break;
    }

    if (!$interval) {
      $transaction = new \Paymill\Models\Request\Transaction();
      $transaction->setToken($token)
        ->setClient($client_id)
        ->setAmount($payment->totalAmount(0))
        ->setCurrency($payment->currency_code)
        ->setDescription($payment->description);
      $transaction_id = $request->create($transaction)->getId();
    } else {
      $offer = new \Paymill\Models\Request\Offer();
      $offer->setAmount($payment->totalAmount(0))
        ->setCurrency($payment->currency_code)
        ->setInterval($interval)
        ->setName($payment->description);
      $offer_id= $request->create($offer)->getId();

      $paymill_payment = new \Paymill\Models\Request\Payment();
      $paymill_payment->setToken($token)
        ->setClient($client_id);
      $paymill_payment_id = $request->create($paymill_payment)->getId();

      $subscription = new \Paymill\Models\Request\Subscription();
      $subscription->setClient($client_id)
        ->setOffer($offer_id)
        ->setPayment($paymill_payment_id);
      $subscription_id = $request->create($subscription)->getId();
    }
    $payment->setStatus(new \PaymentStatusItem(PAYMENT_STATUS_SUCCESS));
  }
}
