import { HederaAccount, NftCreated, NFTDto } from './models/hedera.interface';
import { Fees } from './models/hedera.interface';
import { HederaSdk } from './sdk-hedera/hedera.sdk';
export * from './models/hedera.interface';
export declare enum DebugLevel {
    DEBUG = "DEBUG",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare class ClientNFT {
    hederaSdk: HederaSdk;
    nftStorageApiKey: string;
    constructor({ hederaAccount, nftStorageApiKey, debugLevel }: {
        hederaAccount: HederaAccount;
        nftStorageApiKey: string;
        debugLevel: DebugLevel;
    });
    initialization({ hederaAccount, nftStorageApiKey }: {
        hederaAccount: HederaAccount;
        nftStorageApiKey: string;
    }): Promise<undefined>;
    /**
     * Getting Fees from NFT's creation
     */
    getFees(): Promise<Fees>;
    /**
     *  Create a NFT
     * @param createNFTDto
     */
    createAndMint(createNFTDto: NFTDto): Promise<NftCreated>;
    private static getLogger;
}
