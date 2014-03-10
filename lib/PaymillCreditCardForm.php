<?php
/**
 * @file
 *
 * @author    Paul Haerle <phaer@phaer.org>
 * @copyright Copyright (c) 2013 copyright
 */

namespace Drupal\paymill_payment;


class PaymillCreditCardForm extends \Drupal\payment_forms\CreditCardForm {

  public function getForm(array &$form, array &$form_state) {
    parent::getForm($form, $form_state);
    $payment = &$form_state['payment'];
    $settings = array(
      'paymill_payment' => array(
        'currency_code' => $payment->currency_code,
        'amount' => $payment->totalAmount(0),
        'public_key' => $payment->method->controller_data['public_key'],
        'form_name' => 'submitted[paymethod_select][payment_method_all_forms][Drupalpaymill-paymentCreditCardController]',
      ));

    drupal_add_js($settings, 'setting');
    $form['#attached']['js'] = array(
      array(
        'data' => 'https://bridge.paymill.com/',
        'type' => 'external'
      ),
      array(
        'data' => drupal_get_path('module', 'paymill_payment') . '/paymill_bridge.js',
        'type' => 'file'
      ));

    $form['paymill_payment_token'] = array(
      '#type' => 'hidden',
      '#attributes' => array('class' => array('paymill-payment-token')),
    );

    return $form;
  }

  public function validateForm(array &$element, array &$form_state) {
    $values = drupal_array_get_nested_value(
      $form_state['values'], $element['#parents']);

    parent::validateForm($element, $form_state);
    $form_state['payment']->method_data['paymill_payment_token'] =
      $values['paymill_payment_token'];
  }
}
