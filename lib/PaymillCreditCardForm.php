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

    drupal_add_js(CommonForm::getSettings($payment), 'setting');
    CommonForm::addPaymillBridge($form);
    CommonForm::addTokenField($form);

    return $form;
  }

  public function validateForm(array &$element, array &$form_state) {
    parent::validateForm($element, $form_state);
    CommonForm::addTokenToPaymentMethodData($element, $form_state);
  }
}
