import { NFTDto } from '../models/hedera.interface';
export declare function storeMetadata({ token, name, description, supply, creator, category, cid }: NFTDto & {
    token: string;
    cid: string;
}): Promise<any>;
export declare function storeNFT({ token, media }: NFTDto & {
    token: string;
}): Promise<any>;
export declare function deleteNFT({ cid, token }: {
    cid: string;
    token: string;
}): Promise<import("axios").AxiosResponse<any>>;
