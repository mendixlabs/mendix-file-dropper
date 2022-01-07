import { observable, action, flow, configure } from "mobx";
import md5 from "md5";
import { loadFileInMemory, FileParts } from "../util/file";
import { CancellablePromise } from "mobx/lib/api/flow";

configure({ enforceActions: "observed" });

export type TypeStatus = "loaded" | "not_loaded" | "pending" | "error" | "saved";

export interface IFileDropperFile {
    name: string;
    file?: File;
    saveMethod: ((file: FileDropperFile) => Promise<boolean>) | null;
    error: string;
    status: TypeStatus;
    loadProgress: number;
    base64: string | null;
    previewUrl: string | null;
    hash: string | null;
    guid: string | null;
    data: Blob | null;
    boundTo: string | null;
    deletable: boolean;
    saveFile?: () => CancellablePromise<void>;
    loadFile?: () => CancellablePromise<void>;
    setStatus(status: TypeStatus): void;
}

export class FileDropperFile implements IFileDropperFile {
    public name: string;
    public file?: File;
    public saveMethod: ((file: FileDropperFile) => Promise<boolean>) | null;
    public deletable: boolean = true;

    @observable public error: string = "";
    @observable public status: TypeStatus;
    @observable public loadProgress: number = 0;
    @observable public data: Blob | null = null;
    @observable public base64: string | null = null;
    @observable public previewUrl: string | null = null;
    @observable public hash: string | null = null;
    @observable public guid: string | null = null;
    @observable public boundTo: string | null = null;

    saveFile = flow(function*(this: FileDropperFile) {
        if (!this.file || this.status !== "loaded" || this.saveMethod === null) {
            return;
        }
        this.status = "pending";
        try {
            const saved = yield this.saveMethod(this);
            if (saved) {
                this.status = "saved";
                this.loadProgress = 100;
            } else {
                this.error = "File not saved, check logs";
                this.status = "error";
            }
            // @ts-ignore
        } catch (error: any) {
            this.error = error;
            this.status = error;
        }
    });

    loadFile = flow(function*(this: FileDropperFile) {
        if (!this.file || this.status !== "not_loaded") {
            return;
        }
        this.status = "pending";
        try {
            const res: any = yield loadFileInMemory(this.file, this.saveBase64);
            const fileData: FileParts = res;
            const { data, base64 } = fileData;

            this.status = data ? "loaded" : "not_loaded";
            this.data = data || null;
            if (base64) {
                if (this.saveBase64) {
                    this.base64 = base64;
                }
                this.hash = md5(base64);
            }
            // @ts-ignore
        } catch (error: any) {
            this.status = "error";
            this.error = error.message || "unknown error";
            this.data = this.base64 = null;
        }
    });

    private saveBase64: boolean = true;

    constructor(
        file: File,
        saveMethod?: ((file: FileDropperFile) => Promise<boolean>) | null,
        saveBase64 = true,
        deletable?: boolean
    ) {
        this.name = file.name;
        this.file = file;
        this.status = "not_loaded";
        this.saveBase64 = saveBase64;
        this.deletable = typeof deletable !== "undefined" ? deletable : true;

        this.saveMethod = typeof saveMethod !== "undefined" ? saveMethod : null;
    }

    @action
    setLoaded(): void {
        this.status = "loaded";
    }

    @action
    setBoundTo(guid: string): void {
        this.boundTo = guid;
    }

    @action
    setStatus(status: TypeStatus): void {
        this.status = status;
    }

    @action
    setPreviewUrl(url: string): void {
        this.previewUrl = url;
    }

    @action
    setLoadProgress(perc: number): void {
        this.loadProgress = perc;
    }

    @action
    setError(err: Error): void {
        this.error = err.message ? err.message : "unknown error";
        this.status = "error";
    }
}
