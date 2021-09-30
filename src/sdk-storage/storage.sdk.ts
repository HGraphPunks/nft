import axios from 'axios';
import {NFTDto} from '../models/hedera.interface';
import fetch from 'node-fetch';
import {FormData} from "formdata-node";

export async function storeMetadata({
                                        token,
                                        name,
                                        description,
                                        supply,
                                        creator,
                                        category,
                                        cid
                                    }: NFTDto & { token: string, cid: string }) {
    return axios.post('https://nft.storage/api/upload', {
        name,
        description,
        creator,
        category,
        supply,
        image: {"type": "string", "description": `https://cloudflare-ipfs.com/ipfs/${cid}`}
    }, {
        headers: {
            common: {
                Authorization: `Bearer ${token}`,
            },
        },
    }).then((res) => {
        return res.data.value.cid;
    });
}

export async function storeNFT({
                                   token,
                                   media
                               }: NFTDto & { token: string }) {
    const formData = new FormData();
    formData.append("file", b64toBlob(media));
    return axios.post('https://api.nft.storage/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            common: {
                Authorization: `Bearer ${token}`,
            },
        },
    }).then((res) => {
        return res.data.value.cid;
    });
}

export async function deleteNFT({cid, token}: { cid: string, token: string }) {
    return axios.delete(`https://nft.storage/api/${cid}`, {
        headers: {
            common: {
                Authorization: `Bearer ${token}`,
            },
        },
    })
}


const b64toBlob = (base64: string, type = 'application/octet-stream') =>
    fetch(`data:${type};base64,${base64}`).then(res => res.blob())
