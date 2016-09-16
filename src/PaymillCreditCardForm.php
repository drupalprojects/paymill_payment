<?php

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

  public function getForm(array &$form, array &$form_state, \Payment $payment) {
    parent::getForm($form, $form_state, $payment);

    $settings = CommonForm::getSettings($payment);
    $settings['paymill_payment']['pmid-' . $payment->method->pmid]['method'] = 'credit_card';
    drupal_add_js($settings, 'setting');
    CommonForm::addPaymillBridge($form);
    CommonForm::addTokenField($form, $payment->method->pmid);

    return $form;
  }

  public function validateForm(array &$element, array &$form_state, \Payment $payment) {
    // Paymill takes care of the real validation, client-side.
    CommonForm::addTokenToPaymentMethodData($element, $form_state, $payment);
  }
}
