import { Redirect } from 'expo-router';

/**
 * Squad's return page deep-links to nexus://payment. The checkout screen that opened Squad
 * verifies the payment itself, so if the link opens the app here we just go home.
 */
export default function PaymentReturn() {
  return <Redirect href="/" />;
}
