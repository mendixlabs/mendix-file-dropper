import { observable, action, flow, configure, computed } from "mobx";
import { FileDropperTexts } from "../util/texts";
import { ValidationMessage } from "@jeltemx/mendix-react-widget-utils/lib/validation";
import { IFileDropperFile, FileDropperFile } from "./fileDropperFile";

configure({ enforceActions: "observed" });

export interface FileDropperGuids {
    context?: string | null;
    files?: string[];
}

export interface FileDropperStoreProps {
    files: IFileDropperFile[];
}

export interface FileDropperStoreOptions {
    saveMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    deleteMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    verifyMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    subscriptionHandler: ((guids: FileDropperGuids) => void) | null;
    texts: FileDropperTexts;
    autoLoad?: boolean;
    autoSave?: boolean;
    accept?: string;
    maxNumber?: number;
    maxSize?: number;
    contextObject?: mendix.lib.MxObject;
    validationMessages?: ValidationMessage[];
    saveBase64?: boolean;
}

export class FileDropperStore implements FileDropperStoreProps {
    public accept: string | undefined;
    public maxNumber: number;
    public maxSize: number | undefined;

    public saveMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    public deleteMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    public verifyMethod: ((file: IFileDropperFile) => Promise<boolean>) | null;
    public subscriptionHandler: (guids: FileDropperGuids) => void;

    public autoLoad: boolean;
    public autoSave: boolean;
    public saveBase64: boolean;

    @observable public contextObject: mendix.lib.MxObject | null;
    @observable public validationMessages: ValidationMessage[] = [];
    @observable public files: IFileDropperFile[] = [];
    @observable public texts: FileDropperTexts;

    saveFile = flow(function*(this: FileDropperStore, file: IFileDropperFile) {
        if (file.loadFile && (this.autoSave || this.autoLoad)) {
            yield file.loadFile();
        }
        if (file.saveFile && this.autoSave) {
            yield file.saveFile();
        }
        if (file.status === "saved" && this.verifyMethod !== null) {
            const validated = yield this.verifyMethod(file);
            if (!validated) {
                this.addValidationMessage(
                    new ValidationMessage(`File: '${file.name}' rejected by the server`, "warning")
                );
                yield this.deleteFile(file);
            }
        }
        this.subscriptionHandler(this.filesGuids);
    });

    deleteFile = flow(function*(this: FileDropperStore, file: IFileDropperFile) {
        // We need to make sure we first clear all subscriptions, otherwise it will delete twice
        this.subscriptionHandler({});
        const files = this.files;
        const found = files.findIndex(f => f.name === file.name);
        if (found !== -1) {
            if (file.status === "saved" && this.deleteMethod !== null) {
                const deleted = yield this.deleteMethod(file);
                if (!deleted) {
                    return;
                }
            }
            files.splice(found, 1);
            this.files = files;
            this.subscriptionHandler(this.filesGuids);
        }
    });

    /**
     * Used when a subscription is fired and the file is deleted
     */
    deleteFileShallow = flow(function*(this: FileDropperStore, guid: string) {
        const files = this.files;
        const found = files.findIndex(f => f.guid === guid);
        if (found !== -1) {
            const file = this.files[found];
            file.setStatus("loaded");
            yield this.deleteFile(file);
        }
    });

    constructor(opts: FileDropperStoreOptions) {
        const {
            saveMethod,
            deleteMethod,
            verifyMethod,
            subscriptionHandler,
            autoLoad,
            autoSave,
            contextObject,
            maxNumber,
            accept,
            maxSize,
            texts,
            validationMessages,
            saveBase64
        } = opts;

        this.validationMessages = validationMessages || [];
        this.saveMethod = saveMethod;
        this.deleteMethod = deleteMethod;
        this.verifyMethod = verifyMethod;
        this.subscriptionHandler = subscriptionHandler !== null ? subscriptionHandler : () => {};
        this.autoLoad = typeof autoLoad !== "undefined" ? autoLoad : true;
        this.autoSave = typeof autoSave !== "undefined" ? autoSave : false;
        this.saveBase64 = typeof saveBase64 !== "undefined" ? saveBase64 : true;
        this.contextObject = typeof contextObject !== "undefined" ? contextObject : null;
        this.accept = accept;
        this.maxNumber = typeof maxNumber !== "undefined" ? maxNumber : 0;
        this.maxSize = maxSize;
        this.texts = texts;
    }

    @action
    public setContext(obj: mendix.lib.MxObject | null): void {
        this.contextObject = obj;
        this.subscriptionHandler(this.filesGuids);
    }

    @computed
    get maxFilesReached(): boolean {
        return !(this.maxNumber === 0 || this.files.length < this.maxNumber);
    }

    @computed
    get disabled(): boolean {
        const fatalCount = this.validationMessages.filter(m => m.fatal).length;
        return fatalCount > 0 || this.maxFilesReached || this.contextObject === null;
    }

    get filesGuids(): FileDropperGuids {
        return {
            context: this.contextObject ? this.contextObject.getGuid() : null,
            files: this.files.filter(file => file.guid !== null).map(file => file.guid as string)
        };
    }

    @action
    public addFile(file: File): void {
        const found = this.files.findIndex(f => f.name === file.name);
        if (found === -1) {
            const newFile = new FileDropperFile(file, this.saveMethod, this.saveBase64);
            this.files.push(newFile);
            this.saveFile(newFile);
        }
    }

    @action addValidationMessage(message: ValidationMessage): void {
        this.validationMessages.push(message);
    }

    @action removeValidationMessage(id: string): void {
        const messages = [...this.validationMessages];
        const found = messages.findIndex(m => m.id === id);
        if (found !== -1) {
            messages.splice(found, 1);
            this.validationMessages = messages;
        }
    }
}
