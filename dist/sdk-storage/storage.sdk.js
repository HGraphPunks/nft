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
exports.deleteNFT = exports.storeNFT = exports.storeMetadata = void 0;
const axios_1 = __importDefault(require("axios"));
// import fetch from 'node-fetch';
// import {FormData} from "formdata-node";
function storeMetadata({ token, name, description, supply, creator, category, cid }) {
    return __awaiter(this, void 0, void 0, function* () {
        return axios_1.default.post('https://nft.storage/api/upload', {
            name,
            description,
            creator,
            category,
            supply,
            image: { "type": "string", "description": `https://cloudflare-ipfs.com/ipfs/${cid}` }
        }, {
            headers: {
                common: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }).then((res) => {
            return res.data.value.cid;
        });
    });
}
exports.storeMetadata = storeMetadata;
function storeNFT({ token, media }) {
    return __awaiter(this, void 0, void 0, function* () {
        const formData = new FormData();
        // formData.append("file", b64toBlob(media));
        return axios_1.default.post('https://api.nft.storage/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                common: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }).then((res) => {
            return res.data.value.cid;
        });
    });
}
exports.storeNFT = storeNFT;
function deleteNFT({ cid, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        return axios_1.default.delete(`https://nft.storage/api/${cid}`, {
            headers: {
                common: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    });
}
exports.deleteNFT = deleteNFT;
const b64toBlob = (base64, type = 'application/octet-stream') => fetch(`data:${type};base64,${base64}`).then(res => res.blob());
