export interface FileParts {
    data: Blob;
    base64: string;
}

export const convertBase64ToBlob = (base64Uri: string, contentType: string): Blob => {
    const sliceSize = 512;
    const byteCharacters = atob(base64Uri.split(";base64,")[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};

export const loadFileInMemory = (file: File, loadWithReader = true): Promise<FileParts> =>
    new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("File appears to be empty"));
        }
        if (!loadWithReader || (file.size && file.size > 20 * 1024 * 1024)) {
            // If filesize is over 20Mb, we're not going to bother to read the base64 string for a preview
            resolve({
                base64: "",
                data: file
            });
        } else {
            const reader = new FileReader();

            reader.onabort = () => {
                reject(new Error(`Loading file ${file.name} aborted`));
            };

            reader.onerror = error => {
                reject(error);
            };

            reader.onload = ({ target: { result } }: any) => {
                if (file.size === 0) {
                    return resolve({
                        base64: '',
                        data: new Blob()
                    })
                }
                const data = convertBase64ToBlob(result as string, file.type);
                resolve({
                    base64: result,
                    data
                });
            };

            reader.readAsDataURL(file);
        }
    });
