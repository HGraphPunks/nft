import axios from 'axios';
import {NFTDto} from '../models/hedera.interface';

export async function storeNFT({
                                   token,
                                   name,
                                   description,
                                   creator,
                                   category,
                                   supply,
                                   media
                               }: NFTDto & { token: string }) {
    return axios.post('https://nft.storage/api/upload', {
        name,
        description,
        creator,
        category,
        supply,
        photo: media
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

export async function deleteNFT({cid, token}: {cid: string, token: string}) {
    return axios.delete(`https://nft.storage/api/${cid}`, {
        headers: {
            common: {
                Authorization: `Bearer ${token}`,
            },
        },
    })
}


