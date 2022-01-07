import { Component, ReactNode, createElement } from "react";
import { observer } from "mobx-react";
import Dropzone, { DropEvent, FileRejection } from "react-dropzone";

import { classes } from "../util/classes";
import { FileDropperTexts } from "../util/texts";

export interface FileDropZoneProps {
    onDrop: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
    accept?: string;
    maxNumber: number;
    maxSize?: number;
    texts: FileDropperTexts;
    disabled: boolean;
}

@observer
export class FileDropZone extends Component<FileDropZoneProps, {}> {
    render(): ReactNode {
        const { onDrop, accept, maxNumber, maxSize, disabled, texts } = this.props;
        return (
            <Dropzone onDrop={onDrop} accept={accept} multiple={maxNumber !== 1} maxSize={maxSize} disabled={disabled}>
                {({ getRootProps, getInputProps, isFocused, isDragActive, isFileDialogActive }) => (
                    <div
                        {...getRootProps()}
                        className={classes("dropzone", {
                            disabled,
                            focus: isFocused,
                            drag: isDragActive,
                            dialog: isFileDialogActive
                        })}
                    >
                        <input {...getInputProps()} className={classes("input")} />
                        {texts.DROPZONE}
                        {disabled ? " (disabled)" : ""}
                    </div>
                )}
            </Dropzone>
        );
    }
}
