/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51MdFvcF1XyvkeS7gRhuTwVkaTL7g5pQx0A1iqQ1WVfTgwXblWc1RjtofO3WkCLSnE30pdqPsdLMXbwIdD8B54Lm4000kka1apT'
    );
    // get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
    );
    // create checkout form + process + charge
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
