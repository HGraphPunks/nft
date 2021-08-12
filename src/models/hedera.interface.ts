export interface HederaAccount {
    accountId: string;
    privateKey: string;
    environment?: HederaEnviroment;
}

export interface NFTDto {
    /* Name of the NFT */
    name: string;
    /* Description of the NFT */
    description: string;
    /* Category of the NFT */
    category: CategoryNFT;
    /* Creator of the NFT */
    creator: string;
    /* Media to linked to the NFT - base64 Format */
    media: string;
    /* Quantity of NFT to create */
    supply: number;
}

export interface NftCreated {
    url: string;
    txId: string;
    tokenId: string;
}

export interface Fees {
    hbar: number;
    usd: number;
}

export enum HederaEnviroment {
    MAINNET = "mainnet",
    TESTNET = 'testnet'
}

export enum CategoryNFT {
    ART = 'Art',
    DIGITAL_ART = 'Digital art',
    MUSIC = "Music",
    COLLECTIBLE = "Collectible",
    DOCUMENT = "Document",
    OTHER = "Other",
}
