import axios from 'axios';
import {showAlert} from './alerts';
const stripe = Stripe('pk_test_51GxBhaJgcyo0q4CjuhwYlkD75CSX6iacVlZyEbVwHrlXqTiws9qMeZnWKALoKVQdxFuJlyM0FVhasQb7Sybe6gYI00PGTeHsML');



export const bookTour = async (tourId) => {
  try{


  // get checkout session from api endpoint
  const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    console.log(session)
  //create checkout form + charge the credit card
  await stripe.redirectToCheckout({
    sessionId: session.data.session.id
  });
} catch(e){
  console.log(e)
  showAlert('error', e);
}


}
