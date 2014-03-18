<?php
/**
 * @file
 *
 * @author    Paul Haerle <phaer@phaer.org>
 * @copyright Copyright (c) 2013 copyright
 */

namespace Drupal\paymill_payment;


class PaymillCreditCardForm extends \Drupal\payment_forms\CreditCardForm {
  static protected $issuers = array(
    'visa'           => 'Visa',
    'mastercard'     => 'MasterCard',
    'amex'           => 'American Express',
    'jcb'            => 'JCB',
    'maestro_uk'     => 'Maestro UK',
    'carte_bleue'    => 'Carte Bleue',
    'diners_club'    => 'Diners Club',
    'discover'       => 'Discover',
    'china_unionpay' => 'China UnionPay',
  );
  static protected $cvc_label = array(
    'visa'           => 'CVV2 (Card Verification Value 2)',
    'amex'           => 'CID (Card Identification Number)',
    'mastercard'     => 'CVC2 (Card Validation Code 2)',
    'jcb'            => 'CSC (Card Security Code)',
    'maestro_uk'     => 'CSC (Card Security Code)',
    'carte_bleue'    => 'CSC (Card Security Code)',
    'diners_club'    => 'CSC (Card Security Code)',
    'discover'       => 'CID (Card Identification Number)',
    'china_unionpay' => 'CSC (Card Security Code)',
  );

  public function getForm(array &$form, array &$form_state) {
    parent::getForm($form, $form_state);
    $payment = &$form_state['payment'];

    drupal_add_js(CommonForm::getSettings($payment), 'setting');
    CommonForm::addPaymillBridge($form);
    CommonForm::addTokenField($form);

    return $form;
  }

  public function validateForm(array &$element, array &$form_state) {
    // Paymill takes care of the real validation, client-side.
    CommonForm::addTokenToPaymentMethodData($element, $form_state);
  }
}
