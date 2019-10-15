import axios from "axios";
import { FileDropperFile } from "../store/fileDropperFile";

let requestNumber = 0;

export const createObject = (entity: string): Promise<mendix.lib.MxObject> =>
    new Promise((resolve: (value: mendix.lib.MxObject) => void, reject) => {
        mx.data.create({ entity, callback: resolve, error: reject });
    });

export const commitObject = (mxobj: mendix.lib.MxObject): Promise<void> =>
    new Promise((resolve, reject) => {
        mx.data.commit({ mxobj, callback: resolve, error: reject });
    });

export const deleteObjectGuid = (guid: string): Promise<void> =>
    new Promise((resolve, reject) => {
        mx.data.remove({ guid, callback: resolve, error: reject });
    });

export const getObject = (guid: string): Promise<mendix.lib.MxObject | null> =>
    new Promise((resolve, reject) => {
        mx.data.get({ guid, callback: resolve, error: reject });
    });

export const saveDocument = (name: string, file: Blob, obj: mendix.lib.MxObject): Promise<void> =>
    new Promise((resolve, reject) => {
        mx.data.saveDocument(obj.getGuid(), name, {}, file, resolve, reject);
    });

interface Progress {
    loaded: number;
    total: number;
}

export const entityIsImage = (entity: string): boolean => {
    return mx.meta.getEntity(entity).isA("System.Image");
};

export const entityIsFileDocument = (entity: string): boolean => {
    return mx.meta.getEntity(entity).isA("System.FileDocument");
};

export const entityIsPersistable = (entity: string): boolean => {
    return mx.meta.getEntity(entity).isPersistable();
};

export const savePostMethod = (
    dropperFile: FileDropperFile,
    obj: mendix.lib.MxObject
): Promise<mendix.lib.MxObject | null> =>
    new Promise((resolve, reject) => {
        const { name, data } = dropperFile;
        if (!data) {
            return reject(new Error("No data!"));
        }

        const url = `/file?guid=${obj.getGuid()}`;
        const requestStart = new Date().getTime();
        const requestId = `${requestStart}-${requestNumber++}`;

        const formData: FormData = new FormData();
        formData.append("data", JSON.stringify({ changes: {}, objects: [] }));
        formData.append("blob", data, name);

        const headers: { [key: string]: string } = {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            "X-Csrf-Token": mx.session.getConfig("csrftoken"),
            "X-Mx-ReqToken": requestId,
            "X-Requested-With": "XMLHttpRequest"
        };

        axios
            .request({
                method: "POST",
                url,
                data: formData,
                headers,
                onUploadProgress: (p: Progress) => {
                    const num = Math.floor((p.loaded / p.total) * 100);
                    const perc = num < 0 ? 0 : num > 100 ? 100 : num;
                    dropperFile.setLoadProgress(perc);
                }
            })
            .then(() => {
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
