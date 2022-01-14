import { Component, ReactNode, createElement } from "react";
import { observer } from "mobx-react";
import { FaRegTimesCircle, FaRegArrowAltCircleUp, FaSync, FaExclamationTriangle } from "react-icons/fa";
import { TiDocument } from "react-icons/ti";
import fileSize from "filesize";
import { Line as ProgressLine } from "rc-progress";
import mime from "mime";

import { IFileDropperFile } from "../store/fileDropperFile";

import { classes } from "../util/classes";
import { CancellablePromise } from "mobx/lib/api/flow";

export interface UIProgressBarColors {
    primary: string;
    trail: string;
    error: string;
    success: string;
}

export interface UIProps {
    mainClasses: null | string;
    deleteButtonStyle: null | string;
    saveButtonStyle: null | string;
    errorButtonStyle: null | string;
    uiShowPreview: boolean;
    uiShowPreviewLabel: boolean;
    uiShowImagePreviews: boolean;
    uiShowFileSize: boolean;
    uiHideProgressOnComplete: boolean;
    uiProgressBarColors: UIProgressBarColors;
    uiDeleteFileText: string;
}
export interface FileListProps {
    uiProps: UIProps;
    files: IFileDropperFile[];
    contextObject?: mendix.lib.MxObject | null;
    deleteFile?: (file: IFileDropperFile) => CancellablePromise<void>;
}

@observer
export class FileList extends Component<FileListProps, {}> {
    constructor(props: FileListProps) {
        super(props);

        this.renderDeleteButton = this.renderDeleteButton.bind(this);
        this.renderProgress = this.renderProgress.bind(this);
        this.renderFileSize = this.renderFileSize.bind(this);
    }

    render(): ReactNode {
        const { files, contextObject } = this.props;
        const showFiles =
            typeof contextObject === "undefined"
                ? files
                : contextObject !== null
                ? files.filter(f => f.boundTo === null || f.boundTo === contextObject.getGuid())
                : [];
        return (
            <ul className={classes("list", { empty: showFiles.length === 0 })}>
                {showFiles.map((file, index) => this.renderFile(file, index))}
            </ul>
        );
    }

    private renderFile(file: IFileDropperFile, index: number): ReactNode {
        const { uiShowPreview, uiShowFileSize, uiHideProgressOnComplete } = this.props.uiProps;
        const type = this.getFileExtension(file);
        const itemClassNames = classes("item", { type, state: file.status }, [
            uiShowPreview ? "" : "no-preview",
            uiShowFileSize ? "" : "no-filesize",
            uiHideProgressOnComplete ? "" : "hide-on-complete",
            file.status
        ]);
        return (
            <li className={itemClassNames} key={`${file.name}-${index}`}>
                {this.renderPreview(file)}
                <div className={classes("item-info")}>
                    <div className={classes("item-name")}>{file.name}</div>
                    {this.renderFileSize(file)}
                    {this.renderProgress(file)}
                </div>
                <div className={classes("button-zone")}>
                    {this.renderDeleteButton(file)}
                    {this.renderLoadButton(file)}
                    {this.renderSaveButton(file)}
                    {this.renderError(file)}
                    {this.renderPending(file)}
                </div>
            </li>
        );
    }

    private renderLoadButton(file: IFileDropperFile): ReactNode {
        if (file.status !== "not_loaded") {
            return null;
        }
        const { saveButtonStyle } = this.props.uiProps;
        const action: () => void = () => {
            if (file.loadFile) {
                file.loadFile.call(file);
            }
        };
        return saveButtonStyle !== null ? (
            this.renderGlyph(saveButtonStyle, action)
        ) : (
            <FaRegArrowAltCircleUp className={classes("button-zone__button")} onClick={action} />
        );
    }

    private renderSaveButton(file: IFileDropperFile): ReactNode {
        if (file.status !== "loaded") {
            return null;
        }
        const { saveButtonStyle } = this.props.uiProps;
        const action: () => void = () => {
            if (file.saveFile) {
                file.saveFile.call(file);
            }
        };
        return saveButtonStyle !== null ? (
            this.renderGlyph(saveButtonStyle, action)
        ) : (
            <FaRegArrowAltCircleUp className={classes("button-zone__button")} onClick={action} />
        );
    }

    private renderDeleteButton(file: IFileDropperFile): ReactNode {
        const { uiProps, deleteFile } = this.props;
        const { uiDeleteFileText, deleteButtonStyle } = uiProps;
        if (
            !(file.status === "loaded" || file.status === "saved" || file.status === "error") ||
            typeof deleteFile === "undefined"
        ) {
            return null;
        }
        const action: () => void = () => {
            if (file.status === "saved" && uiDeleteFileText) {
                mx.ui.confirmation({
                    content: uiDeleteFileText,
                    proceed: "OK",
                    cancel: "Cancel",
                    handler: () => {
                        deleteFile(file);
                    }
                });
            } else {
                deleteFile(file);
            }
        };
        return deleteButtonStyle !== null ? (
            this.renderGlyph(deleteButtonStyle, action)
        ) : (
            <FaRegTimesCircle className={classes("button-zone__button")} onClick={action} />
        );
    }

    private renderGlyph(buttonStyle: string, action: () => void, types: {} = {}): ReactNode {
        return (
            <i
                className={`glyphicon glyphicon-${buttonStyle} ${classes("button-zone__button", types)}`}
                onClick={action}
            />
        );
    }

    private renderFileSize(file: IFileDropperFile): ReactNode {
        if (!this.props.uiProps.uiShowFileSize) {
            return null;
        }
        const size: string | null = file.file && file.file.size ? fileSize(file.file.size) : null;
        return (
            <div className={classes("item-filesize")}>
                <div className={classes("item-filesize__label")}>Size:</div>
                <div className={classes("item-filesize__value")}>{size !== null ? size : 0}</div>
            </div>
        );
    }

    private renderPreview(file: IFileDropperFile): ReactNode {
        const { uiShowPreview, uiShowImagePreviews } = this.props.uiProps;
        if (!uiShowPreview) {
            return null;
        }
        const type = this.getFileExtension(file);
        if (!uiShowImagePreviews || !file || file.base64 === null || this.getFileClass(file) !== "image") {
            return (
                <div className={classes("preview", { type })}>
                    <TiDocument className={classes("preview__img", { icon: true })} />
                    {this.renderPreviewLabel(file)}
                </div>
            );
        }
        return (
            <div className={classes("preview", { type })}>
                <img src={file.base64} className={classes("preview__img")} />
                {this.renderPreviewLabel(file)}
            </div>
        );
    }

    private renderPreviewLabel(file: IFileDropperFile): ReactNode {
        const fileType = file && file.file ? (file.file.type ? mime.getExtension(file.file.type) : "unknown") : "none";
        if (this.props.uiProps && this.props.uiProps.uiShowPreviewLabel) {
            return <span className={classes("preview__label")}>{fileType}</span>;
        }
        return null;
    }

    private getFileExtension(file: IFileDropperFile): string {
        const type = file && file.file ? (file.file.type ? mime.getExtension(file.file.type) : "unknown") : "none";
        return type === null ? "unknown" : type;
    }

    private renderProgress(file: IFileDropperFile): ReactNode {
        const { uiProgressBarColors } = this.props.uiProps;
        const standardColor = "#a5a5a5";
        const strokeColor =
            file.status === "error"
                ? uiProgressBarColors.error || "#F00"
                : file.status === "saved"
                ? uiProgressBarColors.success || standardColor
                : uiProgressBarColors.primary || standardColor;
        const trailColor = uiProgressBarColors.trail || "a5a5a5";
        const percent = file.status === "error" ? 0 : file.loadProgress;
        if (this.props.uiProps.uiHideProgressOnComplete && file.status === "saved") {
            return null;
        }
        return (
            <div className={classes("item-progress")}>
                <ProgressLine
                    className={classes("item-progress__bar")}
                    percent={percent}
                    strokeColor={strokeColor}
                    trailColor={trailColor}
                />
                <div className={classes("item-progress__text")}>{percent}%</div>
            </div>
        );
    }

    private renderPending(file: IFileDropperFile): ReactNode {
        if (file.status !== "pending") {
            return null;
        }
        return <FaSync className={classes("button-zone__button", { type: "sync" })} />;
    }

    private renderError(file: IFileDropperFile): ReactNode {
        if (file.status !== "error") {
            return null;
        }
        const { errorButtonStyle } = this.props.uiProps;
        return errorButtonStyle !== null ? (
            this.renderGlyph(errorButtonStyle, () => {}, { type: "error" })
        ) : (
            <FaExclamationTriangle className={classes("button-zone__button", { type: "error" })} />
        );
    }

    private getFileClass(dropperFile: IFileDropperFile): string {
        const { file } = dropperFile;
        if (!file) {
            return "empty";
        }
        if (file.type.indexOf("image") === 0) {
            return "image";
        }
        return "unknown";
    }
}
