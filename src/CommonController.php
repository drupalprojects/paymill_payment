<?php

namespace Drupal\paymill_payment;

class CommonController extends \PaymentMethodController {
  public $controller_data_defaults = array(
    'private_key' => '',
    'public_key'  => '',
  );

  public function __construct() {
    $this->payment_configuration_form_elements_callback = 'payment_forms_method_form';
    $this->payment_method_configuration_form_elements_callback = '\Drupal\paymill_payment\configuration_form';
  }

  public function execute(\Payment $payment) {
    $context = &$payment->context_data['context'];
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
      $varibles = array(
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

  /**
   * Helper for entity_load().
   */
  public static function load($entities) {
    $pmids = array();
    foreach ($entities as $method) {
      if ($method->controller instanceof CommonController) {
        $pmids[] = $method->pmid;
      }
    }
    if ($pmids) {
      $query = db_select('paymill_payment_payment_method_controller', 'controller')
        ->fields('controller')
        ->condition('pmid', $pmids);
      $result = $query->execute();
      while ($data = $result->fetchAssoc()) {
        $method = $entities[$data['pmid']];
        unset($data['pmid']);
        $method->controller_data = (array) $data;
        $method->controller_data += $method->controller->controller_data_defaults;
      }
    }
  }

  /**
   * Helper for entity_insert().
   */
  public function insert($method) {
    $method->controller_data += $this->controller_data_defaults;

    $query = db_insert('paymill_payment_payment_method_controller');
    $values = array_merge($method->controller_data, array('pmid' => $method->pmid));
    $query->fields($values);
    $query->execute();
  }

  /**
   * Helper for entity_update().
   */
  public function update($method) {
    $query = db_update('paymill_payment_payment_method_controller');
    $values = array_merge($method->controller_data, array('pmid' => $method->pmid));
    $query->fields($values);
    $query->condition('pmid', $method->pmid);
    $query->execute();
  }

  /**
   * Helper for entity_delete().
   */
  public function delete($method) {
    db_delete('paymill_payment_payment_method_controller')
      ->condition('pmid', $method->pmid)
      ->execute();
  }

}

/* Implements PaymentMethodController::payment_method_configuration_form_elements_callback().
 *
 * @return array
 *   A Drupal form.
 */
function configuration_form(array $form, array &$form_state) {
  $controller_data = $form_state['payment_method']->controller_data;

  $library = libraries_detect('paymill-php');
  if (empty($library['installed'])) {
    drupal_set_message($library['error message'], 'error', FALSE);
  }

  $form['private_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Private key'),
    '#description' => t('Available from My Account / Settings / API keys on paymill.com'),
    '#required' => true,
    '#default_value' => isset($controller_data['private_key']) ? $controller_data['private_key'] : '',
  );

  $form['public_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Public key'),
    '#description' => t('Available from My Account / Settings / API keys on paymill.com'),
    '#required' => true,
    '#default_value' => isset($controller_data['public_key']) ? $controller_data['public_key'] : '',
  );

  return $form;
}

/**
 * Implements form validate callback for
 * \paymill_payment\configuration_form().
 */
function configuration_form_validate(array $element, array &$form_state) {
  $values = drupal_array_get_nested_value($form_state['values'], $element['#parents']);
  $form_state['payment_method']->controller_data['private_key'] = $values['private_key'];
  $form_state['payment_method']->controller_data['public_key'] = $values['public_key'];
}
