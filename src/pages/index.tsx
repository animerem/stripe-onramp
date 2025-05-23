import Head from 'next/head'
import Script from 'next/script'
import { loadStripeOnramp } from '@stripe/crypto'
import { useEffect } from 'react'

export default function Home({ clientSecret }: { clientSecret: string | null }) {
  const loadOnramp = async (clientSecret: string) => {
    if (typeof window === 'undefined' || !clientSecret) return;

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key is not defined');
      return;
    }

    try {
      const stripeOnramp = await loadStripeOnramp(publishableKey);
      if (!stripeOnramp) throw new Error("Onramp failed to load.");

      const onrampSession = stripeOnramp.createSession({
        clientSecret,
        appearance: { theme: 'dark' }
      });
      onrampSession.mount("#onramp-element");
    } catch (err) {
      console.error("Stripe Onramp error:", err);
    }
  };

  useEffect(() => {
    if (clientSecret) loadOnramp(clientSecret);
  }, [clientSecret]);

  return (
    <>
      <Head>
        <title>Grizzly Stripe Onramp</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
        <Script src="https://crypto-js.stripe.com/crypto-onramp-outer.js" strategy="beforeInteractive" />
        <div
          id="onramp-element"
          style={{ marginTop: '4vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        />
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      headers: {
        Authorization: 'Bearer ' + process.env.STRIPE_API_KEY,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const res = await response.json();
    const clientSecret = res['client_secret'] ?? null;

    return { props: { clientSecret } };
  } catch (err) {
    console.error('Error fetching Stripe Onramp session:', err);
    return { props: { clientSecret: null } };
  }
}