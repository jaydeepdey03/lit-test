import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { LIT_ABILITY, LIT_RPC } from "@lit-protocol/constants"
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { createSiweMessageWithRecaps, generateAuthSig, LitAccessControlConditionResource, LitActionResource, LitPKPResource } from "@lit-protocol/auth-helpers";
import { litActionCode } from "../utils/code";
import { config } from 'dotenv'
import { EthWalletProvider, GoogleProvider, LitRelay } from '@lit-protocol/lit-auth-client';
config()

export class MyLitClass {
    litNodeClient: LitJsSdk.LitNodeClientNodeJs | undefined;
    chain;
    capacityDelegationAuthSig: any;


    ethWallet: ethers.Wallet | undefined;
    walletAddress: string | undefined;

    // See more access control conditions here: https://developer.litprotocol.com/sdk/access-control/evm/basic-examples
    accessControlConditions: any[] = [
        {
            contractAddress: "",
            standardContractType: "",
            chain: "ethereum",
            method: "eth_getBalance",
            parameters: [":userAddress", "latest"],
            returnValueTest: {
                comparator: ">=",
                value: "1000000000000" // 0.000001 ETH
            }
        }
    ];

    constructor(chain: string) {

        if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not found in .env file")

        this.chain = chain;

        this.ethWallet = new ethers.Wallet(
            process.env.PRIVATE_KEY ?? "",
            new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
        );
    }


    async connect() {
        if (!this.ethWallet) throw new Error("Ethereum Wallet not initialized")
        this.litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
            alertWhenUnauthorized: false,
            litNetwork: "datil-dev",
            debug: process.env.NODE_ENV === "development",
        })



        console.log("🔄 Connecting to Lit network...");
        await this.litNodeClient.connect();

        console.log("✅ Connected to Lit network");

        this.walletAddress = await this.ethWallet.getAddress();



        // let contractClient = new LitContracts({
        //     signer: ethWallet,
        //     network: "datil-dev",
        //     debug: true
        // });

        // await contractClient.connect();
    }



    async mintPkp() {
        try {
            console.log("🔄 Connecting LitContracts client to network...");
            const litContracts = new LitContracts({
                signer: this.ethWallet,
                network: "datil-dev",
            });
            await litContracts.connect();
            console.log("✅ Connected LitContracts client to network");

            console.log("🔄 Minting new PKP...");
            const pkp = (await litContracts.pkpNftContractUtils.write.mint()).pkp;
            console.log(
                `✅ Minted new PKP with public key: ${pkp.publicKey} and ETH address: ${pkp.ethAddress}`
            );
            return pkp;
        } catch (error) {
            console.error(error);
        }
    }


    async executeLitAction(pkpPublicKey: string) {


        try {
            if (!this.litNodeClient) throw new Error("Lit Node Client not initialized")
            if (!this.ethWallet) throw new Error("Ethereum Wallet not initialized")
            console.log(this.chain, 'this.chain')
            const sessionSignature = await this.litNodeClient.getSessionSigs({
                chain: this.chain,
                expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
                resourceAbilityRequests: [
                    {
                        resource: new LitPKPResource("*"),
                        ability: LIT_ABILITY.PKPSigning,
                    },
                    {
                        resource: new LitActionResource("*"),
                        ability: LIT_ABILITY.LitActionExecution,
                    }
                ],

                authNeededCallback: async (authRequest) => {
                    const toSign = await createSiweMessageWithRecaps({
                        uri: authRequest.uri!,
                        expiration: authRequest.expiration!,
                        resources: authRequest.resourceAbilityRequests!,
                        walletAddress: this.walletAddress!,
                        nonce: await this.litNodeClient!.getLatestBlockhash(),
                        litNodeClient: this.litNodeClient!,

                    })


                    return await generateAuthSig({
                        signer: this.ethWallet!,
                        toSign,
                    })
                }
            });

            if (!this.litNodeClient) throw new Error("Lit Node Client not initialized")
            const message = new Uint8Array(
                await crypto.subtle.digest(
                    "SHA-256",
                    new TextEncoder().encode("Hello world")
                )
            );




            console.log("🔄 Executing Lit Action...");
            const litActionSignatures = await this.litNodeClient.executeJs({
                sessionSigs: sessionSignature,
                code: litActionCode,
                jsParams: {
                    toSign: message,
                    publicKey: pkpPublicKey,
                    sigName: "sig1",
                },
            });

            console.log("✅ Executed Lit Action");


            console.log(litActionSignatures, 'litActionSignatures')
            return litActionSignatures;
        } catch (error: any) {

            console.log(error.message)
        }

    }




    async encrypt() {

    }

    async decrypt() {

    }


    async wallet() {
        if (!this.litNodeClient) throw new Error("Lit Node Client not initialized")
        const litRelay = new LitRelay({
            relayUrl: LitRelay.getRelayUrl("datil-dev"),
            relayApiKey: 'w2fb4jlb-p75f-gote-oog5-ng5tyxd0l53a_jaydeep',
        });

        const googleProvider = new GoogleProvider({ relay: litRelay, litNodeClient: this.litNodeClient });

        // Begin login flow with Google
        await googleProvider.signIn();

    }


    async disconnect() {
        if (!this.litNodeClient) throw new Error("Lit Node Client not initialized")
        this.litNodeClient.disconnect()
    }

}

