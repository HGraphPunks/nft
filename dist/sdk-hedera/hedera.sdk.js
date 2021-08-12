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
const HEDERA_CREATE_NFT_FEES = 1;
class HederaSdk {
    constructor(hederaAccount) {
        this.hederaAccount = hederaAccount;
        this.client = this.setClient({
            accountId: this.hederaAccount.accountId,
            privateKey: this.hederaAccount.privateKey,
            environment: this.hederaAccount.environment
        });
    }
    createNFT({ name, cid, supply }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                /* Create the NFT */
                const tx = yield new sdk_1.TokenCreateTransaction()
                    .setTokenName(name)
                    .setTokenSymbol(`IPFS://${cid}`)
                    .setDecimals(0)
                    .setInitialSupply(supply)
                    .setTreasuryAccountId(this.hederaAccount.accountId)
                    .setAutoRenewAccountId(this.hederaAccount.accountId)
                    .setAutoRenewPeriod(7776000)
                    .signWithOperator(this.client);
                /*  submit to a Hedera network */
                const response = yield tx.execute(this.client);
                /* Get the receipt of the transaction */
                const receipt = yield response.getReceipt(this.client);
                /* Get the token ID from the receipt */
                const tokenId = receipt.tokenId;
                return {
                    url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
                    txId: response.transactionId.toString(),
                    tokenId: receipt.tokenId.toString()
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
                hbar: +parseFloat((HEDERA_CREATE_NFT_FEES / hbarPrice).toFixed(3))
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
                yield Promise.reject("You don't have enough money available in your account :: Remaining :: "
                    + balance + ' :: Price :: ' + hederaFees);
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
                return +balance.hbars.toTinybars().toNumber() / 100000000;
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
        return this.retryOperation(this.getBalance(), 2000, 3);
    }
    /**
     * Getting the current HBAR price in usd
     */
    getHbarToCurrency() {
        return axios_1.default
            .get(`https://api.coingecko.com/api/v3/coins/hedera-hashgraph?market_data=true`)
            .then(res => {
            return +res.data.market_data.current_price['usd'];
        });
    }
    wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    retryOperation(operation, delay, retries) {
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
exports.HederaSdk = HederaSdk;
