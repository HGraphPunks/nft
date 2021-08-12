import { Fees, HederaAccount, NftCreated } from '../models/hedera.interface';
export declare class HederaSdk {
    readonly hederaAccount: HederaAccount;
    private client;
    constructor(hederaAccount: HederaAccount);
    createNFT({ name, cid, supply }: {
        name: string;
        cid: string;
        supply: number;
    }): Promise<NftCreated>;
    /**
     *  Hedera fees for NFT's creation
     */
    getFees(): Promise<Fees>;
    private checkBalance;
    /**
     * Set Hedera SDK Client
     * @param accountId
     * @param privateKey
     * @param environment
     */
    private setClient;
    /**
     *  Get User's Balance in Hbar
     */
    private getBalance;
    /**
     * Retry the Get Balance method
     */
    private getBalanceWrapper;
    /**
     * Getting the current HBAR price in usd
     */
    private getHbarToCurrency;
    private wait;
    private retryOperation;
}
