import { NFTDto } from '../models/hedera.interface';
export declare function storeNFT({ token, name, description, creator, category, media }: NFTDto & {
    token: string;
}): Promise<any>;
export declare function deleteNFT({ cid, token }: {
    cid: string;
    token: string;
}): Promise<import("axios").AxiosResponse<any>>;
