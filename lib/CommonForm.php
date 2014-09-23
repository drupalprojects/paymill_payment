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
    return array(
      'paymill_payment' => array(
        'public_key' => $payment->method->controller_data['public_key'],
        'error_messages' => array(
          'internal_server_error'        => t('Internal server error'),
          'invalid_public_key'           => t('Invalid public key'),
          'invalid_payment_data'         => t('Invalid payment data'),
          'unknown_error'                => t('Unknown error'),
          '3ds_cancelled'                => t('3-D Secure cancelled'),
          'field_invalid_card_number'    => t('Invalid card number'),
          'field_invalid_card_exp_year'  => t('Invalid expiry year'),
          'field_invalid_card_exp_month' => t('Invalid expiry month'),
          'field_invalid_card_exp'       => t('Invalid expiry date.'),
          'field_invalid_card_cvc'       => t('Invalid CVC'),
          'field_invalid_card_holder'    => t('Invalid card holder'),
          'field_invalid_amount_int'     => t('Invalid amount'),
          'field_invalid_currency'       => t('Invalid currency'),
          'field_invalid_account_number' => t('Invalid account_number'),
          'field_invalid_account_holder' => t('Invalid account_holder'),
          'field_invalid_bank_code'      => t('Invalid bank code'),
          'field_invalid_iban'           => t('Invalid bic'),
          'field_invalid_bic'            => t('Invalid bic'),
          'field_invalid_country'        => t('Invalid country'),
          'field_invalid_bank_data'      => t('Invalid bank data'),
        )
      ));
  }

  public static function addPaymillBridge(&$form) {
    drupal_add_js(
      drupal_get_path('module', 'paymill_payment') . '/paymill_bridge.js',
      'file'
    );
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
