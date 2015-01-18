<?php

namespace Drupal\paymill_payment;

class PaymillAccountForm extends \Drupal\payment_forms\AccountForm {

  public function getForm(array &$form, array &$form_state, \Payment $payment) {
    parent::getForm($form, $form_state, $payment);

    // Paymill does not accept a country parameter for direct debit atm.
    unset($form['account']['country']);

    drupal_add_js(CommonForm::getSettings($payment), 'setting');
    CommonForm::addPaymillBridge($form);
    CommonForm::addTokenField($form);

    return $form;
  }

  public function validateForm(array &$element, array &$form_state, \Payment $payment) {
    // Paymill takes care of the real validation.
    CommonForm::addTokenToPaymentMethodData($element, $form_state, $payment);
  }
}
