"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientNFT = exports.DebugLevel = void 0;
const hedera_interface_1 = require("./models/hedera.interface");
const hedera_sdk_1 = require("./sdk-hedera/hedera.sdk");
const storage_sdk_1 = require("./sdk-storage/storage.sdk");
const js_logger_1 = __importDefault(require("js-logger"));
/* Export Interfaces */
__exportStar(require("./models/hedera.interface"), exports);
var DebugLevel;
(function (DebugLevel) {
    DebugLevel["DEBUG"] = "DEBUG";
    DebugLevel["WARN"] = "WARN";
    DebugLevel["ERROR"] = "ERROR";
})(DebugLevel = exports.DebugLevel || (exports.DebugLevel = {}));
js_logger_1.default.useDefaults();
class ClientNFT {
    constructor({ hederaAccount, nftStorageApiKey, debugLevel }) {
        js_logger_1.default.setLevel(ClientNFT.getLogger(debugLevel));
        this.initialization({ hederaAccount, nftStorageApiKey }).catch(console.log);
    }
    initialization({ hederaAccount, nftStorageApiKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            js_logger_1.default.info('Initialization on Hedera', hederaAccount.environment ? hederaAccount.environment.toUpperCase() : hedera_interface_1.HederaEnviroment.MAINNET);
            if (!hederaAccount.accountId || !hederaAccount.privateKey) {
                js_logger_1.default.error('Please provide an accountID and a privateKey... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
                return Promise.reject('Please we need your Account ID and private Key in order to use the Hedera SDK - https://portal.hedera.com/register');
            }
            if (!nftStorageApiKey) {
                js_logger_1.default.error('Please provide a nftStorageApiKey... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
                return Promise.reject('Please we need your Api Key in order to store your NFT on IPFS - https://nft.storage/');
            }
            this.hederaSdk = new hedera_sdk_1.HederaSdk(Object.assign({ environment: hedera_interface_1.HederaEnviroment.MAINNET }, hederaAccount));
            this.nftStorageApiKey = nftStorageApiKey;
        });
    }
    /**
     * Getting Fees from NFT's creation
     */
    getFees() {
        return __awaiter(this, void 0, void 0, function* () {
            js_logger_1.default.info('Getting fees...');
            return yield this.hederaSdk.getFees();
        });
    }
    /**
     *  Create a NFT
     * @param createNFTDto
     */
    createAndMint(createNFTDto) {
        return __awaiter(this, void 0, void 0, function* () {
            let cidMetadata;
            let cid;
            if (!createNFTDto.media || !createNFTDto.name) {
                js_logger_1.default.error('name and media parameters must be defined when calling this method... Check the Usage on https://www.npmjs.com/package/@xact-wallet-sdk/nft#usage');
                return Promise.reject('Please define at least a Media and a Name for your NFT !');
            }
            try {
                /* Checking the balance */
                js_logger_1.default.info('Checking user\'s balance...');
                yield this.hederaSdk.checkBalance();
                /* Storing the Media */
                js_logger_1.default.info('Saving the media on FileCoin...');
                cid = yield storage_sdk_1.storeNFT(Object.assign({ token: this.nftStorageApiKey }, createNFTDto));
                js_logger_1.default.info('Saving the metadata on FileCoin...');
                cidMetadata = yield storage_sdk_1.storeMetadata(Object.assign(Object.assign({ token: this.nftStorageApiKey }, createNFTDto), { cid }));
                /* Create the NFT */
                js_logger_1.default.info('Creating the NFT on Hedera...');
                const res = yield this.hederaSdk.createNFT({
                    name: createNFTDto.name,
                    creator: createNFTDto.creator,
                    category: createNFTDto.category,
                    supply: createNFTDto.supply,
                    cid: cidMetadata,
                    customFee: createNFTDto.customRoyaltyFee
                });
                js_logger_1.default.debug('Your NFT will be available soon on', res.url);
                return res;
            }
            catch (e) {
                js_logger_1.default.error('An error occurred while creating the NFT...');
                /* Remove the File from Storage if an error occurred while creating the NFT on Hedera */
                if (cid) {
                    js_logger_1.default.warn('Removing your media from FileCoin...');
                    if (cidMetadata) {
                        yield storage_sdk_1.deleteNFT({ cid: cidMetadata, token: this.nftStorageApiKey });
                    }
                    yield storage_sdk_1.deleteNFT({ cid, token: this.nftStorageApiKey });
                }
                return Promise.reject(e);
            }
        });
    }
    static getLogger(debugLevel) {
        switch (debugLevel) {
            case 'DEBUG':
                return js_logger_1.default.DEBUG;
            case 'WARN':
                return js_logger_1.default.WARN;
            case 'ERROR':
                return js_logger_1.default.ERROR;
            default:
                return js_logger_1.default.OFF;
        }
    }
}
exports.ClientNFT = ClientNFT;
