<?php
/**
 * @file
 *
 * @author    Paul Haerle <phaer@phaer.org>
 * @copyright Copyright (c) 2013 copyright
 *
 */

namespace Drupal\paymill_payment;

class CommonForm {
  public static function getSettings($payment) {
    $controller_css_name = drupal_clean_css_identifier(
      $payment->method->controller->name);
    $settings = array(
      'paymill_payment' => array(
        'currency_code' => $payment->currency_code,
        'amount' => $payment->totalAmount(0),
        'public_key' => $payment->method->controller_data['public_key'],
        'form_name' => 'submitted[paymethod_select][payment_method_all_forms]' .
          '[' . $controller_css_name . ']',
      ));
    return $settings;
  }

  public static function addPaymillBridge(&$form) {
    $form['#attached']['js'] = array(
      array(
        'data' => 'https://bridge.paymill.com/',
        'type' => 'external'
      ),
      array(
        'data' => drupal_get_path('module', 'paymill_payment') .
          '/paymill_bridge.js',
        'type' => 'file'
      ));
  }

  public static function addTokenField(&$form) {
    $form['paymill_payment_token'] = array(
      '#type' => 'hidden',
      '#attributes' => array('class' => array('paymill-payment-token')),
    );
  }

  public static function addTokenToPaymentMethodData(&$element, &$form_state) {
    $values = drupal_array_get_nested_value(
      $form_state['values'], $element['#parents']);
    $form_state['payment']->method_data['paymill_payment_token'] =
      $values['paymill_payment_token'];
  }
}
