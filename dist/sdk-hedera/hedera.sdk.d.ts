import { Fees, HederaAccount, NftCreated, CustomFee, CategoryNFT } from '../models/hedera.interface';
export declare class HederaSdk {
    readonly hederaAccount: HederaAccount;
    private client;
    constructor(hederaAccount: HederaAccount);
    createNFT({ name, description, creator, category, cid, supply, customFee }: {
        name: string;
        description: string;
        creator: string;
        category: CategoryNFT;
        cid: string;
        supply: number;
        customFee: CustomFee | null;
    }): Promise<NftCreated>;
    /**
     *  Hedera fees for NFT's creation
     */
    getFees(): Promise<Fees>;
    checkBalance(): Promise<void>;
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
