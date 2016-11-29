<?php

namespace Drupal\paymill_payment;

class CommonController extends \PaymentMethodController {
  public $controller_data_defaults = array(
    'private_key' => '',
    'public_key'  => '',
  );

  public function __construct() {
    $this->payment_configuration_form_elements_callback = 'payment_forms_payment_form';
    $this->payment_method_configuration_form_elements_callback = 'payment_forms_method_configuration_form';
  }

  public function configurationForm() {
    return new ControllerConfigurationForm();
  }

  public function execute(\Payment $payment) {
    $context = $payment->contextObj;
    $api_key = $payment->method->controller_data['private_key'];

    switch ($context->value('donation_interval')) {
      case 'm': $interval = '1 MONTH'; break;
      case 'y': $interval = '1 YEAR'; break;
      default:  $interval = NULL; break;
    }

    try {
      $this->token = $payment->method_data['paymill_payment_token'];
      $this->request = new \Paymill\Request($api_key);

      $client = $this->createClient(
        $this->getName($context),
        $context->value('email')
      );

      if (!$interval) {
        $transaction = $this->createTransaction($client, $payment);
      } else {
        $offer_id = $this->createOffer($payment, $interval);
        $paymill_payment = $this->createPaymillPayment($client);
        $subscription = $this->createSubscription(
          $client, $offer_id, $paymill_payment);
      }
      $payment->setStatus(new \PaymentStatusItem(PAYMENT_STATUS_SUCCESS));
    }
    catch(\Paymill\Services\PaymillException $e) {
      $payment->setStatus(new \PaymentStatusItem(PAYMENT_STATUS_FAILED));

      $message = '@method payment method encountered an error while trying ' .
        'to contact the paymill server. The response code was "@response", ' .
        'the status code "@status" and the error message "@message". ' .
        '(pid: @pid, pmid: @pmid)';
      $variables = array(
        '@response' => $e->getResponseCode(),
        '@status'   => $e->getStatusCode(),
        '@message'  => $e->getErrorMessage(),
        '@pid'      => $payment->pid,
        '@pmid'     => $payment->method->pmid,
        '@method'   => $payment->method->title_specific,
      );
      watchdog('paymill_payment', $message, $variables, WATCHDOG_ERROR);
    }
  }

  public function getTotalAmount(\Payment $payment) {
    // convert amount to cents. Integer value.
    return (int) ($payment->totalAmount(0) * 100);
  }

  public function createClient($description, $email) {
    $client = new \Paymill\Models\Request\Client();
    $client->setDescription($description)
      ->setEmail($email);
    return $this->request->create($client);
  }

  public function createTransaction($client, $payment) {
    $totalAmount = $this->getTotalAmount($payment);
    $transaction = new \Paymill\Models\Request\Transaction();
    $transaction->setToken($this->token)
      ->setClient($client->getId())
      ->setAmount($totalAmount)
      ->setCurrency($payment->currency_code)
      ->setDescription($payment->description);
    return $this->request->create($transaction);
  }

  public function createOffer($payment, $interval) {
    $offer = new \Paymill\Models\Request\Offer();

    $offer->setFilter(array(
        'amount'   => $this->getTotalAmount($payment),
        'interval' => $interval,
        'currency' => $payment->currency_code,
      ));
    $existing = $this->request->getAll($offer);
    if (!empty($existing)) {
      return $existing[0]['id'];
    }
    else {
      $offer->setAmount($this->getTotalAmount($payment))
        ->setCurrency($payment->currency_code)
        ->setInterval($interval)
        ->setName($payment->description);
      return $this->request->create($offer)->getId();
    }
  }

  public function createPaymillPayment($client) {
      $paymill_payment = new \Paymill\Models\Request\Payment();
      $paymill_payment->setToken($this->token)
        ->setClient($client->getId());
      return $this->request->create($paymill_payment);
  }

  public function createSubscription($client, $offer_id, $paymill_payment) {
      $subscription = new \Paymill\Models\Request\Subscription();
      $subscription->setClient($client->getId())
        ->setOffer($offer_id)
        ->setPayment($paymill_payment->getId());
      return $this->request->create($subscription);
  }

  public function getName($context) {
    return trim(
      $context->value('title') . ' ' .
      $context->value('first_name') . ' ' .
      $context->value('last_name')
    );
  }

}
