<?php

namespace Drupal\paymill_payment;

module_load_include('php', 'payment_forms', 'lib/CreditCardForm');

class CreditCardController extends \Drupal\paymill_payment\CommonController {
  public function __construct() {
    $this->payment_method_configuration_form_elements_callback = '\Drupal\paymill_payment\configuration_form';
    $this->title = t('Paymill Credit Card');
    $this->form = new \Drupal\payment_forms\CreditCardForm();
  }
}

/* Implements PaymentMethodController::payment_method_configuration_form_elements_callback().
 *
 * @return array
 *   A Drupal form.
 */
function configuration_form(array $form, array &$form_state) {
  $controller_data = $form_state['payment_method']->controller_data;
  dpm($controller_data);
  $form['api_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Paymill API key'),
    '#description' => t('Available from My Account / Settings / API keys on paymill.com'),
    '#required' => true,
    '#default_value' => isset($controller_data['api_key']) ? $controller_data['api_key'] : '',
  );

  return $form;
}

/**
 * Implements form validate callback for
 * \paymill_payment\configuration_form().
 */
function configuration_form_validate(array $element, array &$form_state) {
  $values = drupal_array_get_nested_value($form_state['values'], $element['#parents']);
  dpm($values['api_key']);
  $form_state['payment_method']->controller_data['api_key'] = $values['api_key'];
}
