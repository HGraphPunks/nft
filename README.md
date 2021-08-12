# `@xact-wallet-sdk/nft`

> Create a NFT with Hedera and FileCoin

## Installation

1. Install package from npm and dependencies.

`npm i @xact-wallet-sdk/nft`

## Before Starting

1. Please create your account on [Hedera Portal.](https://portal.hedera.com/register)

2. Please create your account on [NFT Storage.](https://nft.storage/login/)

## Usage

```
/* Create a new instance of Client */
const hederaAccount = {
    accountId: 'YOUR_ACCOUNTID',
    privateKey: 'YOUR_PRIVATEKEY',
    environment: HederaEnviroment.TESTNET, /* Default to MAINNET */
};
    
/* Construct an instance of Client */
const client = new ClientNFT({hederaAccount, nftStorageApiKey: 'YOUR_TOKEN', debugLevel:DebugLevel.DEBUG /* Default to OFF */});

/* Get NFT's creation Fees */
const fees = await client.getFees();

/* Create NFT */
const name = 'NFT Test';
const description = 'Description of my NFT';
const category = CategoryNFT.ART;
const creator = 'Johny.B';
const media = ''; /* File or Base64 format */
const supply = 1; /* Nb of NFT available */
await client.create({name, description, category, creator, media, supply});
```
