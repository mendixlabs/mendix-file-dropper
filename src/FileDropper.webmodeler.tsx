import { Component, ReactNode, createElement } from "react";
import { FileDropperContainerProps } from "../typings/FileDropperProps";
import { getTexts } from "./util/texts";
import { UIProps, FileList } from "./components/FileList";
import { classes } from "./util/classes";
import { FileDropZone } from "./components/FileDropZone";
import { Alerts } from "./components/Alerts";
import { validateProps } from "./util/validation";
import { IFileDropperFile, TypeStatus } from "./store/fileDropperFile";

declare function require(name: string): string;
type VisibilityMap = {
    [P in keyof FileDropperContainerProps]: boolean;
};

class PreviewFile implements IFileDropperFile {
    name: string;
    file?: File;
    saveMethod: null = null;
    error: string = "";
    status: TypeStatus = "saved";
    loadProgress: number = 100;
    base64: string | null = null;
    previewUrl: string | null = null;
    hash: string | null = null;
    data: Blob | null = null;
    boundTo: string | null = null;
    deletable: boolean = false;
    guid: string | null = null;

    constructor(name: string, status?: TypeStatus, load?: number) {
        this.name = name;
        if (status) {
            this.status = status;
        }
        if (load) {
            this.loadProgress = load;
        }
    }

    setStatus(status: TypeStatus): void {
        this.status = status;
    }
}

export class preview extends Component<FileDropperContainerProps> {
    render(): ReactNode {
        const uiProps = this.getUIProps(this.props);
        const texts = getTexts(this.props);
        const validationMessages = validateProps(this.props, {});
        const noop = (): void => {};
        const maxNumber = 1;
        const maxSize = 1 * 1024 * 1024;
        const disabled = false;
        const files = this.getPreviewFiles();
        return (
            <div className={classes()}>
                <FileDropZone onDrop={noop} maxNumber={maxNumber} maxSize={maxSize} texts={texts} disabled={disabled} />
                <Alerts validationMessages={validationMessages} remove={noop} />
                <FileList files={files} uiProps={uiProps} />
            </div>
        );
    }

    private getUIProps(props: FileDropperContainerProps): UIProps {
        const {
            uiDeleteButtonGlyph,
            uiDeleteButtonStyle,
            uiSaveButtonGlyph,
            uiSaveButtonStyle,
            uiErrorButtonGlyph,
            uiErrorButtonStyle,
            uiShowPreviewLabel,
            uiShowImagePreviews,
            uiHideProgressOnComplete
        } = props;

        const deleteButtonStyle =
            uiDeleteButtonStyle === "glyphicon" && uiDeleteButtonGlyph !== "" ? uiDeleteButtonGlyph : null;
        const saveButtonStyle =
            uiSaveButtonStyle === "glyphicon" && uiSaveButtonGlyph !== "" ? uiSaveButtonGlyph : null;
        const errorButtonStyle =
            uiErrorButtonStyle === "glyphicon" && uiErrorButtonGlyph !== "" ? uiErrorButtonGlyph : null;

        return {
            deleteButtonStyle,
            saveButtonStyle,
            errorButtonStyle,
            uiShowPreviewLabel,
            uiShowImagePreviews,
            uiHideProgressOnComplete
        };
    }

    private getPreviewFiles(): PreviewFile[] {
        const list: PreviewFile[] = [
            new PreviewFile("Preview file 1 (saved)"),
            new PreviewFile("Preview file 2 (error)", "error"),
            new PreviewFile("Preview file 3 (loaded)", "loaded"),
            new PreviewFile("Preview file 4 (saving)", "pending", 50)
        ];
        return list;
    }
}

export function getPreviewCss(): string {
    return require("./ui/FileDropper.scss");
}

export function getVisibleProperties(props: FileDropperContainerProps, visibilityMap: VisibilityMap): VisibilityMap {
    visibilityMap.dataNameAttr = props.dataFileEntity !== "";
    visibilityMap.dataExtAttr = props.dataFileEntity !== "";
    visibilityMap.dataTypeAttr = props.dataFileEntity !== "";

    visibilityMap.verificationExtAttr = props.verificationEntity !== "";
    visibilityMap.verificationNameAttr = props.verificationEntity !== "";
    visibilityMap.verificationSizeAttr = props.verificationEntity !== "";
    visibilityMap.verificationTypeAttr = props.verificationEntity !== "";
    visibilityMap.verificationBeforeAcceptMicroflow = props.verificationEntity !== "";
    visibilityMap.verificationBeforeAcceptNanoflow = props.verificationEntity !== "";

    return visibilityMap;
}
