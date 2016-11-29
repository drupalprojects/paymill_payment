<?php

namespace Drupal\paymill_payment;

class ControllerConfigurationForm implements \Drupal\payment_forms\MethodFormInterface {

  /**
   * Add form elements to the $element Form-API array.
   */
  public function form(array $element, array &$form_state, \PaymentMethod $method) {
    $controller_data = $method->controller_data;

    $library = libraries_detect('paymill-php');
    if (empty($library['installed'])) {
      drupal_set_message($library['error message'], 'error', FALSE);
    }

    $element['private_key'] = array(
      '#type' => 'textfield',
      '#title' => t('Private key'),
      '#description' => t('Available from My Account / Settings / API keys on paymill.com'),
      '#required' => true,
      '#default_value' => isset($controller_data['private_key']) ? $controller_data['private_key'] : '',
    );

    $element['public_key'] = array(
      '#type' => 'textfield',
      '#title' => t('Public key'),
      '#description' => t('Available from My Account / Settings / API keys on paymill.com'),
      '#required' => true,
      '#default_value' => isset($controller_data['public_key']) ? $controller_data['public_key'] : '',
    );

    return $element;
  }

  /**
   * Validate the submitted values.
   */
  public function validate(array $element, array &$form_state, \PaymentMethod $method) {
    $values = drupal_array_get_nested_value($form_state['values'], $element['#parents']);
    $method->controller_data['private_key'] = $values['private_key'];
    $method->controller_data['public_key'] = $values['public_key'];
  }

}
