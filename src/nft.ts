import {HederaAccount, HederaEnviroment, NftCreated, NFTDto} from './models/hedera.interface';
import {Fees} from './models/hedera.interface';
import {HederaSdk} from './sdk-hedera/hedera.sdk';
import {deleteNFT, storeNFT} from './sdk-storage/storage.sdk';
import Logger from 'js-logger';

/* Export Interfaces */
export * from './models/hedera.interface';

export enum DebugLevel {
    DEBUG = 'DEBUG',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

Logger.useDefaults();

export class ClientNFT {

    hederaSdk: HederaSdk;
    nftStorageApiKey: string;

    constructor({
                    hederaAccount,
                    nftStorageApiKey,
                    debugLevel
                }: { hederaAccount: HederaAccount, nftStorageApiKey: string, debugLevel: DebugLevel }) {
        Logger.setLevel(ClientNFT.getLogger(debugLevel));
        this.initialization({hederaAccount, nftStorageApiKey}).catch(console.log);
    }

    async initialization({
                             hederaAccount,
                             nftStorageApiKey
                         }: { hederaAccount: HederaAccount, nftStorageApiKey: string }) {
        Logger.info('Initialization on Hedera', hederaAccount.environment ? hederaAccount.environment.toUpperCase() : HederaEnviroment.MAINNET);
        if (!hederaAccount.accountId || !hederaAccount.privateKey) {
            Logger.error('Please provide an accountID and a privateKey... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
            return Promise.reject(
                'Please we need your Account ID and private Key in order to use the Hedera SDK - https://portal.hedera.com/register',
            );
        }
        if (!nftStorageApiKey) {
            Logger.error('Please provide a nftStorageApiKey... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
            return Promise.reject('Please we need your Api Key in order to store your NFT on IPFS - https://nft.storage/');
        }
        this.hederaSdk = new HederaSdk({
            environment: HederaEnviroment.MAINNET,
            ...hederaAccount
        });
        this.nftStorageApiKey = nftStorageApiKey;
    }

    /**
     * Getting Fees from NFT's creation
     */
    async getFees(): Promise<Fees> {
        Logger.info('Getting fees...');
        return await this.hederaSdk.getFees();
    }

    /**
     *  Create a NFT
     * @param createNFTDto
     */
    async createAndMint(createNFTDto: NFTDto): Promise<NftCreated> {
        let cid;
        if (!createNFTDto.media || !createNFTDto.name) {
            Logger.error('name and media parameters must be defined when calling this method... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
            return Promise.reject('Please define at least a Media and a Name for your NFT !');
        }
        try {
            /* Checking the balance */
            Logger.info('Checking user\'s balance...');
            await this.hederaSdk.checkBalance();
            /* Storing the Media */
            Logger.info('Saving the media on FileCoin...');
            cid = await storeNFT({token: this.nftStorageApiKey, ...createNFTDto});

            /* Create the NFT */
            Logger.info('Creating the NFT on Hedera...');
            const res = await this.hederaSdk.createNFT({
                name: createNFTDto.name,
                creator: createNFTDto.creator,
                category: createNFTDto.category,
                supply: createNFTDto.supply,
                cid,
                customFee: createNFTDto.customRoyaltyFee
            });
            Logger.debug('Your NFT will be available soon on', res.url);
            return res;
        } catch (e) {
            Logger.error('An error occurred while creating the NFT...');
            /* Remove the File from Storage if an error occurred while creating the NFT on Hedera */
            if (cid) {
                Logger.warn('Removing your media from FileCoin...');
                await deleteNFT({cid, token: this.nftStorageApiKey})
            }
            return Promise.reject(e);
        }
    }

    private static getLogger(debugLevel: DebugLevel) {
        switch (debugLevel) {
            case 'DEBUG':
                return Logger.DEBUG;
            case 'WARN':
                return Logger.WARN;
            case 'ERROR':
                return Logger.ERROR;
            default:
                return Logger.OFF;
        }
    }

}
