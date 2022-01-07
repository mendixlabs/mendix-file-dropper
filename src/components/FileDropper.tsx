import { Component, ReactNode, createElement } from "react";
import { observer } from "mobx-react";
import classNames from "classnames";

import { FileDropperStore } from "../store/fileDropperStore";

import { FileList, UIProps } from "./FileList";
import { FileDropZone } from "./FileDropZone";
import { Alerts } from "./Alerts";
import { ValidationMessage } from "@jeltemx/mendix-react-widget-utils/lib/validation";
import fileSize from "filesize";
import { FileRejection } from "react-dropzone";

export interface FileDropperProps {
    uiProps: UIProps;
    store: FileDropperStore;
}

@observer
export class FileDropper extends Component<FileDropperProps, {}> {
    constructor(props: FileDropperProps) {
        super(props);
        this.onDrop = this.onDrop.bind(this);
    }

    render(): ReactNode {
        const { store, uiProps } = this.props;
        const {
            validationMessages,
            removeValidationMessage,
            deleteFile,
            files,
            contextObject,
            accept,
            maxNumber,
            maxSize,
            texts,
            disabled
        } = store;
        const removeValidation = removeValidationMessage.bind(store);
        const deleteAction = deleteFile.bind(store);

        return (
            <div className={classNames("filedropper", uiProps.mainClasses)}>
                <FileDropZone
                    onDrop={this.onDrop}
                    accept={accept}
                    maxNumber={maxNumber}
                    maxSize={maxSize}
                    texts={texts}
                    disabled={disabled}
                />
                <Alerts validationMessages={validationMessages} remove={removeValidation} />
                <FileList files={files} uiProps={uiProps} deleteFile={deleteAction} contextObject={contextObject} />
            </div>
        );
    }

    private onDrop(acceptedFiles: File[], fileRejections: FileRejection[]): void {
        const { store } = this.props;
        const { FILERECTEDSIZE, FILESREJECTED } = store.texts;
        const maxSize = store.maxSize || null;
        let maxReached = false;

        if (store.maxFilesReached) {
            const message = new ValidationMessage(store.texts.DROPZONEMAXIMUM, "warning");
            store.addValidationMessage(message);
            return;
        }

        if (fileRejections.length > 0) {
            const otherRejected: File[] = [];
            fileRejections.forEach(reject => {
                if (maxSize !== null && reject && reject.file.size && reject.file.size > maxSize) {
                    const text = FILERECTEDSIZE
                        .replace(/%%FILENAME%%/g, reject.file.name)
                        .replace(/%%MAXSIZE%%/g, fileSize(maxSize));

                    const message = new ValidationMessage(
                        text,
                        "warning"
                    );
                    store.addValidationMessage(message);
                } else {
                    otherRejected.push(reject.file);
                }
            });

            if (otherRejected.length > 0) {
                mx.ui.info(
                    [FILESREJECTED, "", ...otherRejected.map(file => file.name)].join("\n"),
                    true
                );
            }
        }

        acceptedFiles.forEach(async file => {
            if (!store.maxFilesReached) {
                await store.addFile(file);
            } else {
                if (!maxReached) {
                    const message = new ValidationMessage(store.texts.DROPZONEMAXIMUM, "warning");
                    store.addValidationMessage(message);
                    maxReached = true;
                }
            }
        });
    }
}
