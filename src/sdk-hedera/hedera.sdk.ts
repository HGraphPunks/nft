import {AccountBalanceQuery, Client, TokenCreateTransaction} from '@hashgraph/sdk';
import axios from 'axios';
import {Fees, HederaAccount, NftCreated, HederaEnviroment} from '../models/hedera.interface';

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

    async createNFT({name, cid, supply}: { name: string, cid: string, supply: number }): Promise<NftCreated> {
        try {
            /* Create the NFT */
            const tx = await new TokenCreateTransaction()
                .setTokenName(name)
                .setTokenSymbol(`IPFS://${cid}`)
                .setDecimals(0)
                .setInitialSupply(supply)
                .setTreasuryAccountId(this.hederaAccount.accountId)
                .setAutoRenewAccountId(this.hederaAccount.accountId)
                .setAutoRenewPeriod(7776000)
                .signWithOperator(this.client)

            /*  submit to a Hedera network */
            const response = await tx.execute(this.client);

            /* Get the receipt of the transaction */
            const receipt = await response.getReceipt(this.client)

            /* Get the token ID from the receipt */
            const tokenId = receipt.tokenId;

            return {
                url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
                txId: response.transactionId.toString(),
                tokenId: receipt.tokenId!.toString()
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

    private async checkBalance() {
        /* Get the Hedera Fees */
        const hederaFees = await this.getFees();

        /* Get User's Balance */
        const balance = await this.getBalanceWrapper();

        /* Checking if the user has enough money */
        if (balance < hederaFees.hbar) {
            await Promise.reject("You don't have enough money available in your account :: Remaining :: "
                + balance + ' :: Price :: ' + hederaFees);
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
            return +balance.hbars.toTinybars().toNumber() / 100000000;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Retry the Get Balance method
     */
    private getBalanceWrapper(): Promise<number> {
        return this.retryOperation(this.getBalance(), 2000, 3) as Promise<number>;
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
