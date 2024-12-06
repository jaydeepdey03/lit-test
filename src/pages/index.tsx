import {LitNodeClient} from "@lit-protocol/lit-node-client";
import {GoogleProvider, LitRelay} from "@lit-protocol/lit-auth-client";
import {
  PROVIDER_TYPE,
  LIT_NETWORK,
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
} from "@lit-protocol/constants";
import {Button} from "@/components/ui/button";

export default function Home() {
  async function connect() {
    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev,
      debug: true,
    });
    await litNodeClient.connect();

    const litRelay = new LitRelay({
      relayUrl: LitRelay.getRelayUrl("datil-dev"),
      relayApiKey: process.env.NEXT_PUBLIC_RELAY_API_KEY,
    });

    const googleProvider = new GoogleProvider({relay: litRelay, litNodeClient});

    await googleProvider.signIn();

    const authMethod = await googleProvider.authenticate();

    console.log(authMethod, "authMethod");
    // -- setting scope for the auth method
    // <https://developer.litprotocol.com/v3/sdk/wallets/auth-methods/#auth-method-scopes>
    const options = {
      permittedAuthMethodScopes: [[AUTH_METHOD_SCOPE.SignAnything]],
    };
    // Mint PKP using the auth method
    const mintTx = await googleProvider.mintPKPThroughRelayer(
      authMethod,
      options
    );

    console.log(mintTx, "mintTx");
    // Fetch PKPs associated with the authenticated social account
    const pkps = await googleProvider.getPKPsForAuthMethod({
      authMethodType: AUTH_METHOD_TYPE.Google,
      authMethodId: authMethod.accessToken,
    });

    return pkps;
  }

  return (
    <div>
      <Button onClick={connect}>Connect</Button>
    </div>
  );
}
