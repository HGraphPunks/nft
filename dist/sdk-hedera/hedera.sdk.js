"use strict";
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
exports.HederaSdk = void 0;
const sdk_1 = require("@hashgraph/sdk");
const axios_1 = __importDefault(require("axios"));
const hedera_interface_1 = require("../models/hedera.interface");
const js_logger_1 = __importDefault(require("js-logger"));
const HEDERA_CREATE_NFT_FEES = 1;
class HederaSdk {
    constructor(hederaAccount) {
        this.hederaAccount = hederaAccount;
        this.client = this.setClient({
            accountId: this.hederaAccount.accountId,
            privateKey: this.hederaAccount.privateKey,
            environment: this.hederaAccount.environment,
        });
    }
    createNFT({ name, creator, category, cid, supply, customFee, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                /* Create a royalty fee */
                const customRoyaltyFee = [];
                if (customFee) {
                    const fee = new sdk_1.CustomRoyaltyFee()
                        .setNumerator(customFee.numerator) // The numerator of the fraction
                        .setDenominator(customFee.denominator) // The denominator of the fraction
                        .setFallbackFee(new sdk_1.CustomFixedFee().setHbarAmount(new sdk_1.Hbar(customFee.fallbackFee))) // The fallback fee
                        .setFeeCollectorAccountId(this.hederaAccount.accountId); // The account that will receive the royalty fee
                    customRoyaltyFee.push(fee);
                }
                const supplyKey = sdk_1.PrivateKey.generate();
                /* Create the NFT */
                const tx = new sdk_1.TokenCreateTransaction()
                    .setTokenType(sdk_1.TokenType.NonFungibleUnique)
                    .setTokenName(name)
                    .setTokenSymbol(`IPFS://${cid}`)
                    .setSupplyKey(supplyKey)
                    .setSupplyType(sdk_1.TokenSupplyType.Finite)
                    .setInitialSupply(0)
                    .setMaxSupply(supply)
                    .setTreasuryAccountId(this.hederaAccount.accountId)
                    .setAutoRenewAccountId(this.hederaAccount.accountId)
                    .setCustomFees(customRoyaltyFee);
                const transaction = yield tx.signWithOperator(this.client);
                /*  submit to the Hedera network */
                const response = yield transaction.execute(this.client);
                /* Get the receipt of the transaction */
                const receipt = yield response.getReceipt(this.client);
                /* Get the token ID from the receipt */
                const tokenId = receipt.tokenId;
                /* Mint the token */
                let nftIds = [];
                const limit_chunk = 5;
                const nbOfChunk = Math.ceil(supply / limit_chunk);
                for (let i = 0; i < nbOfChunk; i++) {
                    const mintTransaction = new sdk_1.TokenMintTransaction().setTokenId(tokenId);
                    for (let i = 0; i < limit_chunk; i++) {
                        mintTransaction.addMetadata(Buffer.from(`https://cloudflare-ipfs.com/ipfs/${cid}`));
                    }
                    /* Sign with the supply private key of the token */
                    const signTx = yield mintTransaction
                        .freezeWith(this.client)
                        .sign(supplyKey);
                    /* Submit the transaction to a Hedera network */
                    const resp = yield signTx.execute(this.client);
                    const receiptMint = yield resp.getReceipt(this.client);
                    /* Get the Serial Number */
                    const serialNumber = receiptMint.serials;
                    /* Get the NftId */
                    for (const nftSerial of serialNumber.values()) {
                        nftIds.push(new sdk_1.NftId(tokenId, nftSerial).toString());
                    }
                }
                return {
                    url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
                    txId: response.transactionId.toString(),
                    tokenId: tokenId.toString(),
                    nftIds,
                };
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
    }
    /**
     *  Hedera fees for NFT's creation
     */
    getFees() {
        return __awaiter(this, void 0, void 0, function* () {
            const hbarPrice = yield this.getHbarToCurrency();
            return {
                usd: HEDERA_CREATE_NFT_FEES,
                hbar: +parseFloat((HEDERA_CREATE_NFT_FEES / hbarPrice).toFixed(3)),
            };
        });
    }
    checkBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            /* Get the Hedera Fees */
            const hederaFees = yield this.getFees();
            /* Get User's Balance */
            const balance = yield this.getBalanceWrapper();
            /* Checking if the user has enough money */
            if (balance < hederaFees.hbar) {
                const err = "You don't have enough money available in your account :: Remaining :: " +
                    balance +
                    " :: Price :: " +
                    hederaFees;
                js_logger_1.default.error(err);
                yield Promise.reject(err);
            }
        });
    }
    /**
     * Set Hedera SDK Client
     * @param accountId
     * @param privateKey
     * @param environment
     */
    setClient({ accountId, privateKey, environment }) {
        let client;
        if (environment === hedera_interface_1.HederaEnviroment.MAINNET) {
            client = sdk_1.Client.forMainnet();
        }
        else {
            client = sdk_1.Client.forTestnet();
        }
        client.setOperator(accountId, privateKey);
        return client;
    }
    /**
     *  Get User's Balance in Hbar
     */
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const balance = yield new sdk_1.AccountBalanceQuery()
                    .setAccountId(this.hederaAccount.accountId)
                    .execute(this.client);
                return +(balance.hbars.toTinybars().toNumber() / 100000000).toFixed(3);
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
    }
    /**
     * Retry the Get Balance method
     */
    getBalanceWrapper() {
        return this.retryOperation(this.getBalance(), 4000, 4);
    }
    /**
     * Getting the current HBAR price in usd
     */
    getHbarToCurrency() {
        return axios_1.default
            .get(`https://api.coingecko.com/api/v3/coins/hedera-hashgraph?market_data=true`)
            .then((res) => {
            return +res.data.market_data.current_price["usd"];
        });
    }
    wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }
    retryOperation(operation, delay, retries) {
        return new Promise((resolve, reject) => {
            return operation.then(resolve).catch((reason) => {
                if (retries > 0) {
                    return (this.wait(delay)
                        .then(this.retryOperation.bind(null, operation, delay, retries - 1))
                        // @ts-ignore
                        .then(resolve)
                        .catch(reject));
                }
                return reject(reason);
            });
        });
    }
}
exports.HederaSdk = HederaSdk;
