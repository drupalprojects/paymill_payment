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

  public function validate(\Payment $payment, \PaymentMethod $payment_method, $strict) {
    // convert amount to cents.
    foreach ($payment->line_items as $name => &$line_item) {
      $line_item->amount = $line_item->amount * 100;
    }
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
