import axios from "axios";
import { FileDropperFile } from "../store/fileDropperFile";

let requestNumber = 0;

interface Progress {
    loaded: number;
    total: number;
}

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
