import { Component, ReactNode, createElement, createRef } from "react";
import { findDOMNode } from "react-dom";
import mime from "mime";
import {
    createObject,
    deleteObjectGuid,
    commitObject,
    getObject
} from "@jeltemx/mendix-react-widget-utils/lib/objects";
import { debug, entityIsFileDocument, entityIsImage, entityIsPersistable } from "@jeltemx/mendix-react-widget-utils";
import { saveDocument } from "@jeltemx/mendix-react-widget-utils/lib/documents";

import { FileDropper } from "./components/FileDropper";
import { FileDropperContainerProps, Nanoflow } from "../typings/FileDropperProps";
import { FileDropperStore, FileDropperGuids } from "./store/fileDropperStore";
import { FileDropperFile } from "./store/fileDropperFile";

import { savePostMethod } from "./util/data";

import { UIProps, UIProgressBarColors } from "./components/FileList";
import { getTexts } from "./util/texts";
import { validateProps, ValidateExtraProps } from "./util/validation";
import { ValidationMessage } from "@jeltemx/mendix-react-widget-utils/lib/validation";

import "./ui/FileDropper.scss";

export interface Action {
    microflow?: string;
    nanoflow?: Nanoflow;
}

class FileDropperContainer extends Component<FileDropperContainerProps, {}> {
    ref = createRef<HTMLDivElement>();

    store: FileDropperStore;
    private widgetId?: string;
    private subscriptionHandles: number[] = [];
    private beforeCommitAction: Action | null = null;
    private isImageType = false;

    constructor(props: FileDropperContainerProps) {
        super(props);

        this.saveFile = this.saveFile.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.verifyFile = this.verifyFile.bind(this);
        this.executeVerification = this.executeVerification.bind(this);
        this.handleSubscriptions = this.handleSubscriptions.bind(this);
        this.debug = this.debug.bind(this);

        const maxFileSize = props.restrictionMaxFileSize * 1024 * 1024;
        const extraValidations: ValidateExtraProps = {};

        let accept;
        if (this.props.restrictionMimeType) {
            accept = this.props.restrictionMimeType;
        }
        if (entityIsImage(props.dataFileEntity)) {
            this.isImageType = true;
            accept = "image/*";
        }

        if (props.verificationEntity !== "" && props.verificationBeforeAcceptMicroflow !== "") {
            this.beforeCommitAction = { microflow: props.verificationBeforeAcceptMicroflow };
        } else if (
            props.verificationEntity !== "" &&
            props.verificationBeforeAcceptNanoflow &&
            props.verificationBeforeAcceptNanoflow.nanoflow
        ) {
            this.beforeCommitAction = { nanoflow: props.verificationBeforeAcceptNanoflow };
        }

        const texts = getTexts(props);

        if (!entityIsFileDocument(props.dataFileEntity)) {
            extraValidations.noFileSystemDocument = true;
        }

        if (props.verificationEntity !== "") {
            if (entityIsPersistable(props.verificationEntity)) {
                extraValidations.noPersistentVerification = true;
            }
        }

        const validationMessages = validateProps(props, extraValidations);

        this.store = new FileDropperStore({
            saveMethod: this.saveFile,
            deleteMethod: this.deleteFile,
            verifyMethod: this.verifyFile,
            subscriptionHandler: this.handleSubscriptions,
            autoSave: props.dataAutoSave,
            maxNumber: props.restrictionMaxFileCount,
            maxSize: maxFileSize,
            uniqueName: props.restrictionUniqueName,
            validationMessages,
            accept,
            texts,
            saveBase64: props.uiShowImagePreviews,
            contextObject: props.mxObject
        });
    }

    componentDidUpdate(): void {
        if (this.widgetId) {
            const domNode = findDOMNode(this);
            // @ts-ignore
            domNode.setAttribute("widgetId", this.widgetId);
        }
    }

    componentWillReceiveProps(nextProps: FileDropperContainerProps): void {
        if (!this.widgetId && this.ref.current) {
            try {
                const domNode = findDOMNode(this);
                // @ts-ignore
                this.widgetId = domNode.getAttribute("widgetId") || undefined;
            } catch (error) {
                const domNode = findDOMNode(this.ref.current);
                // @ts-ignore
                const alternativeID = domNode.getAttribute("data-mendix-id") || undefined;
                this.widgetId = alternativeID;
            }
        }
        this.store.setContext(nextProps.mxObject || null);
    }

    componentWillUnmount(): void {
        this.clearSubscriptions();
    }

    render(): ReactNode {
        const {
            class: mainClasses,
            uiDeleteButtonGlyph,
            uiDeleteButtonStyle,
            uiSaveButtonGlyph,
            uiSaveButtonStyle,
            uiErrorButtonGlyph,
            uiErrorButtonStyle,
            uiShowPreview,
            uiShowPreviewLabel,
            uiShowImagePreviews,
            uiShowFileSize,
            uiHideProgressOnComplete
        } = this.props;

        const deleteButtonStyle =
            uiDeleteButtonStyle === "glyphicon" && uiDeleteButtonGlyph !== "" ? uiDeleteButtonGlyph : null;
        const saveButtonStyle =
            uiSaveButtonStyle === "glyphicon" && uiSaveButtonGlyph !== "" ? uiSaveButtonGlyph : null;
        const errorButtonStyle =
            uiErrorButtonStyle === "glyphicon" && uiErrorButtonGlyph !== "" ? uiErrorButtonGlyph : null;

        const uiProgressBarColors: UIProgressBarColors = {
            primary: this.props.uiPbColorStrokeNormal,
            error: this.props.uiPbColorError,
            success: this.props.uiPbColorSuccess,
            trail: this.props.uiPbColorTrail
        };
        const uiDeleteFileText = this.props.textDeleteFileConfirm;

        const ui: UIProps = {
            mainClasses,
            deleteButtonStyle,
            saveButtonStyle,
            errorButtonStyle,
            uiShowPreview,
            uiShowPreviewLabel,
            uiShowImagePreviews,
            uiShowFileSize,
            uiHideProgressOnComplete,
            uiProgressBarColors,
            uiDeleteFileText
        };

        return (
            <div ref={this.ref}>
                <FileDropper store={this.store} uiProps={ui} />
            </div>
        );
    }

    async saveFile(file: FileDropperFile): Promise<boolean> {
        this.debug("saveFile", file);
        const { dataFileEntity, dataContextAssociation } = this.props;
        let obj: mendix.lib.MxObject | null = null;
        if (file.data === null) {
            return false;
        }

        const verification = await this.executeVerification(file);
        if (!verification) {
            return false;
        }

        const beforeCommitAction = await this.executeBeforeCommit();
        if (!beforeCommitAction) {
            return false;
        }

        try {
            obj = await createObject(dataFileEntity);
            if (dataContextAssociation !== "" && this.store.contextObject !== null) {
                const ref = dataContextAssociation.split("/")[0];
                if (ref && obj.has(ref)) {
                    obj.addReference(ref, this.store.contextObject.getGuid());
                    file.setBoundTo(this.store.contextObject.getGuid());
                }
            }
            if (this.props.dataNameAttr) {
                obj.set(this.props.dataNameAttr, file.name);
            }
            if (this.props.dataTypeAttr && file.file && file.file.type) {
                obj.set(this.props.dataTypeAttr, file.file.type);
            }
            if (this.props.dataExtAttr && file.file && file.file.type) {
                const fileType = mime.getExtension(file.file.type);
                obj.set(this.props.dataExtAttr, fileType);
            }

            await commitObject(obj);

            file.guid = obj.getGuid();

            if (this.props.dataSaveMethod === "saveDocument") {
                file.setLoadProgress(50);
                await saveDocument(file.name, file.data, obj);
                await commitObject(obj);
                file.setLoadProgress(100);
            } else {
                await savePostMethod(file, obj);
                await commitObject(obj);
            }

            if (file.guid !== null && this.isImageType) {
                const docURL = mx.data.getDocumentUrl(obj.getGuid(), obj.get("changedDate") as number);
                mx.data.getImageUrl(docURL, objUrl => {
                    const preview = objUrl + "&target=window";
                    file.setPreviewUrl(preview);
                });
            }

            this.executeAfterCommit(obj);

            return true;
        } catch (error) {
            mx.ui.exception("Error saving files! " + error);
            this.debug(error);
            file.setLoadProgress(0);
            if (obj !== null && obj.getGuid) {
                await deleteObjectGuid(obj.getGuid());
            }
            return false;
        }
    }

    async deleteFile(file: FileDropperFile): Promise<boolean> {
        this.debug("deleteFile", file);
        if ((file.status !== "saved" && file.status !== "error") || file.guid === null) {
            return true;
        }
        try {
            await deleteObjectGuid(file.guid);
            return true;
        } catch (error) {
            mx.ui.exception("Error deleting documents! " + error);
            return false;
        }
    }

    async verifyFile(file: FileDropperFile): Promise<boolean> {
        this.debug("verifyFile", file);
        const { verificationOnAcceptMicroflow } = this.props;
        if (verificationOnAcceptMicroflow === "") {
            return true;
        }
        if (!file.guid) {
            return false;
        }
        const obj = await getObject(file.guid);
        if (obj === null) {
            return false;
        }
        try {
            const test = (await this.executeAction(
                { microflow: verificationOnAcceptMicroflow },
                false,
                obj
            )) as boolean;
            return test;
        } catch (error) {
            return false;
        }
    }

    private async executeVerification(file: FileDropperFile): Promise<boolean> {
        const { verificationEntity } = this.props;
        if (this.beforeCommitAction !== null) {
            try {
                const testObj = await createObject(verificationEntity);

                if (this.props.verificationNameAttr) {
                    testObj.set(this.props.verificationNameAttr, file.name);
                }
                if (this.props.verificationSizeAttr) {
                    testObj.set(this.props.verificationSizeAttr, file.file ? file.file.size : 0);
                }
                if (this.props.verificationTypeAttr && file.file && file.file.type) {
                    testObj.set(this.props.verificationTypeAttr, file.file.type);
                }
                if (this.props.verificationExtAttr && file.file && file.file.type) {
                    const fileType = mime.getExtension(file.file.type);
                    testObj.set(this.props.verificationExtAttr, fileType || "");
                }

                await commitObject(testObj);

                const verifyError = (await this.executeAction(this.beforeCommitAction, false, testObj)) as
                    | null
                    | string
                    | undefined;

                if (typeof verifyError !== "undefined" && verifyError !== "" && verifyError !== null) {
                    const errorText = this.store.texts.FILESREJECTEDBYSERVER.replace(
                        /%%FILENAME%%/g,
                        file.name
                    ).replace(/%%ERROR%%/g, verifyError);

                    this.store.addValidationMessage(new ValidationMessage(errorText, "warning"));
                    this.store.deleteFile(file);
                    return false;
                }
            } catch (error) {
                mx.ui.exception("Error testing files! " + error);
                this.debug(error);
                file.setStatus("error");
                file.setLoadProgress(0);
                return false;
            }
        }
        return true;
    }

    private async executeBeforeCommit(): Promise<boolean> {
        const { eventsBeforeCommitMf, eventsBeforeCommitNf } = this.props;
        const obj = this.store.contextObject;
        if (obj && (eventsBeforeCommitMf !== "" || (eventsBeforeCommitNf && eventsBeforeCommitNf.nanoflow))) {
            let action: Action = {};
            if (eventsBeforeCommitMf !== "") {
                action = {
                    microflow: eventsBeforeCommitMf
                };
            } else if (eventsBeforeCommitNf && eventsBeforeCommitNf.nanoflow) {
                action = {
                    nanoflow: eventsBeforeCommitNf
                };
            }
            return this.executeAction(action, true, obj) as Promise<boolean>;
        }
        return true;
    }

    private async executeAfterCommit(obj: mendix.lib.MxObject): Promise<void> {
        const { eventsAfterCommitMf, eventsAfterCommitNf } = this.props;
        if (obj && (eventsAfterCommitMf !== "" || (eventsAfterCommitNf && eventsAfterCommitNf.nanoflow))) {
            let action: Action = {};
            if (eventsAfterCommitMf !== "") {
                action = {
                    microflow: eventsAfterCommitMf
                };
            } else if (eventsAfterCommitNf && eventsAfterCommitNf.nanoflow) {
                action = {
                    nanoflow: eventsAfterCommitNf
                };
            }
            this.executeAction(action, true, obj);
        }
    }

    private getContext(obj?: mendix.lib.MxObject): mendix.lib.MxContext {
        const context = new window.mendix.lib.MxContext();

        if (obj && obj.getGuid) {
            const entity = obj.getEntity();
            context.setContext(entity, obj.getGuid());
            // @ts-ignore
        } else if (this.props.mxObject) {
            context.setContext(this.props.mxObject.getEntity(), this.props.mxObject.getGuid());
        }

        return context;
    }

    private executeAction(
        action: Action,
        showError = false,
        obj?: mendix.lib.MxObject
    ): Promise<string | number | boolean | mendix.lib.MxObject | mendix.lib.MxObject[] | void> {
        this.debug("executeAction", action, obj && obj.getGuid());
        return new Promise((resolve, reject) => {
            const context = this.getContext(obj);

            if (action.microflow) {
                window.mx.data.action({
                    params: {
                        actionname: action.microflow
                    },
                    context,
                    origin: this.props.mxform,
                    callback: resolve,
                    error: error => {
                        if (showError) {
                            window.mx.ui.error(
                                `An error occurred while executing action ${action.microflow} : ${error.message}`
                            );
                        }
                        reject(error);
                    }
                });
            } else if (action.nanoflow) {
                window.mx.data.callNanoflow({
                    nanoflow: action.nanoflow,
                    context,
                    origin: this.props.mxform,
                    callback: resolve,
                    error: error => {
                        if (showError) {
                            window.mx.ui.error(
                                `An error occurred while executing nanoflow ${action.nanoflow}: ${error.message}`
                            );
                        }
                        reject(error);
                    }
                });
            } else {
                reject(new Error("No microflow/nanoflow defined"));
            }
        });
    }

    private handleSubscriptions(guids: FileDropperGuids): void {
        this.clearSubscriptions();
        const { subscribe } = window.mx.data;
        const ids: string[] = [];

        if (guids.files && guids.files.length > 0) {
            guids.files.forEach(fileGuid => {
                ids.push(fileGuid);
                this.subscriptionHandles.push(
                    subscribe({
                        guid: fileGuid,
                        callback: async () => {
                            const getObj = await getObject(fileGuid);
                            if (getObj === null) {
                                this.store.deleteFileShallow(fileGuid);
                            }
                        }
                    })
                );
            });
        }
        this.debug("handleSubscriptions, subscribed to: ", ids);
    }

    private clearSubscriptions(): void {
        const { unsubscribe } = window.mx.data;

        if (this.subscriptionHandles && this.subscriptionHandles.length > 0) {
            this.subscriptionHandles.forEach(unsubscribe);
            this.subscriptionHandles = [];
        }
    }

    private debug(...args: any): void {
        const id = this.props.friendlyId || this.widgetId || "mendix.filedropper.FileDropper";
        debug(id, ...args);
    }
}

export default FileDropperContainer;
