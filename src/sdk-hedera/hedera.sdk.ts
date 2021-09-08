import {
    AccountBalanceQuery,
    Client, CustomFixedFee,
    CustomRoyaltyFee, Hbar,
    NftId, PrivateKey,
    TokenCreateTransaction,
    TokenId, TokenMintTransaction, TokenNftInfoQuery, TokenSupplyType,
    TokenType
} from '@hashgraph/sdk';
import axios from 'axios';
import {Fees, HederaAccount, NftCreated, HederaEnviroment, CustomFee, CategoryNFT} from '../models/hedera.interface';
import Logger from 'js-logger';

const HEDERA_CREATE_NFT_FEES = 1;

export class HederaSdk {

    readonly hederaAccount: HederaAccount;
    private client: Client;

    constructor(hederaAccount: HederaAccount) {
        this.hederaAccount = hederaAccount;
        this.client = this.setClient({
            accountId: this.hederaAccount.accountId,
            privateKey: this.hederaAccount.privateKey,
            environment: this.hederaAccount.environment
        });
    }

    async createNFT({
                        name,
                        creator,
                        category,
                        cid,
                        supply,
                        customFee
                    }: { name: string, creator: string, category: CategoryNFT, cid: string, supply: number, customFee: CustomFee | null }): Promise<NftCreated> {
        try {
            /* Create a royalty fee */
            const customRoyaltyFee = [];
            if (customFee) {
                const fee = new CustomRoyaltyFee()
                    .setNumerator(customFee.numerator) // The numerator of the fraction
                    .setDenominator(customFee.denominator) // The denominator of the fraction
                    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(customFee.fallbackFee))) // The fallback fee
                    .setFeeCollectorAccountId(this.hederaAccount.accountId) // The account that will receive the royalty fee
                customRoyaltyFee.push(fee);
            }

            const supplyKey = PrivateKey.generate();

            /* Create the NFT */
            const tx = new TokenCreateTransaction()
                .setTokenType(TokenType.NonFungibleUnique)
                .setTokenName(name)
                .setTokenSymbol(`IPFS://${cid}`)
                .setSupplyKey(supplyKey)
                .setSupplyType(TokenSupplyType.Finite)
                .setInitialSupply(0)
                .setMaxSupply(supply)
                .setTreasuryAccountId(this.hederaAccount.accountId)
                .setAutoRenewAccountId(this.hederaAccount.accountId)
                .setCustomFees(customRoyaltyFee)

            const transaction = await tx.signWithOperator(this.client)

            /*  submit to the Hedera network */
            const response = await transaction.execute(this.client);

            /* Get the receipt of the transaction */
            const receipt = await response.getReceipt(this.client)

            /* Get the token ID from the receipt */
            const tokenId = receipt.tokenId;

            /* Mint the token */
            const mintTransaction = new TokenMintTransaction()
                .setTokenId(tokenId!)

            for (let i = 0; i < supply; i++) {
                mintTransaction.addMetadata(Buffer.from(JSON.stringify({name, creator, category, supply})));
            }

            /* Sign with the supply private key of the token */
            const signTx = await mintTransaction.freezeWith(this.client).sign(supplyKey);
            /* Submit the transaction to a Hedera network */
            const resp = await signTx.execute(this.client);
            const receiptMint = await resp.getReceipt(this.client);
            /* Get the Serial Number */
            const serialNumber = receiptMint.serials;

            /* Get the NftId */
            let nftIds = [];
            for (const nftSerial of serialNumber.values()) {
                nftIds.push(new NftId(tokenId!, nftSerial).toString());
            }

            return {
                url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
                txId: response.transactionId.toString(),
                tokenId: tokenId!.toString(),
                nftIds,
            };
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     *  Hedera fees for NFT's creation
     */
    async getFees(): Promise<Fees> {
        const hbarPrice = await this.getHbarToCurrency()
        return {
            usd: HEDERA_CREATE_NFT_FEES,
            hbar: +parseFloat((HEDERA_CREATE_NFT_FEES / hbarPrice).toFixed(3))
        }
    }

    async checkBalance() {
        /* Get the Hedera Fees */
        const hederaFees = await this.getFees();

        /* Get User's Balance */
        const balance = await this.getBalanceWrapper();

        /* Checking if the user has enough money */
        if (balance < hederaFees.hbar) {
            const err = "You don't have enough money available in your account :: Remaining :: "
                + balance + ' :: Price :: ' + hederaFees;
            Logger.error(err);
            await Promise.reject(err);
        }
    }

    /**
     * Set Hedera SDK Client
     * @param accountId
     * @param privateKey
     * @param environment
     */
    private setClient({accountId, privateKey, environment}: HederaAccount) {
        let client;
        if (environment === HederaEnviroment.MAINNET) {
            client = Client.forMainnet()
        } else {
            client = Client.forTestnet();
        }
        client.setOperator(accountId, privateKey);
        return client;
    }


    /**
     *  Get User's Balance in Hbar
     */
    private async getBalance(): Promise<number> {
        try {
            const balance = await new AccountBalanceQuery()
                .setAccountId(this.hederaAccount.accountId)
                .execute(this.client)
            return +(balance.hbars.toTinybars().toNumber() / 100000000).toFixed(3);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Retry the Get Balance method
     */
    private getBalanceWrapper(): Promise<number> {
        return this.retryOperation(this.getBalance(), 4000, 4) as Promise<number>;
    }

    /**
     * Getting the current HBAR price in usd
     */
    private getHbarToCurrency(): Promise<number> {
        return axios
            .get(
                `https://api.coingecko.com/api/v3/coins/hedera-hashgraph?market_data=true`
            )
            .then(res => {
                return +res.data.market_data.current_price['usd'];
            })

    }


    private wait(ms: number) {
        return new Promise(r => setTimeout(r, ms));
    }

    private retryOperation<T>(operation: Promise<T>, delay: number, retries: number): Promise<T> {
        return new Promise((resolve, reject) => {
            return operation
                .then(resolve)
                .catch((reason) => {
                    if (retries > 0) {
                        return this.wait(delay)
                            .then(this.retryOperation.bind(null, operation, delay, retries - 1))
                            // @ts-ignore
                            .then(resolve)
                            .catch(reject);
                    }
                    return reject(reason);
                });
        });
    }

}
