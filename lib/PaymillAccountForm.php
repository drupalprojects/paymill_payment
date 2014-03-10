<?php
/**
 * @file
 *
 * @author    Paul Haerle <phaer@phaer.org>
 * @copyright Copyright (c) 2014 copyright
 */

namespace Drupal\paymill_payment;


class PaymillAccountForm extends \Drupal\payment_forms\AccountForm {

  public function getForm(array &$form, array &$form_state) {
    parent::getForm($form, $form_state);
    $payment = &$form_state['payment'];

    // Paymill does not accept a country parameter for direct debit atm.
    unset($form['account']['country']);

    drupal_add_js(CommonForm::getSettings($payment), 'setting');
    CommonForm::addPaymillBridge($form);
    CommonForm::addTokenField($form);

    return $form;
  }

  public function validateForm(array &$element, array &$form_state) {
    // Paymill takes care of the real validation.
    CommonForm::addTokenToPaymentMethodData($element, $form_state);
  }
}
