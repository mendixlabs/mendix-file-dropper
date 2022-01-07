import { CSSProperties } from "react";

interface CommonProps {
    id: string;
    class: string;
    style?: CSSProperties;
    friendlyId?: string;
    tabIndex: number;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
}

export interface Nanoflow {
    nanoflow: object[];
    paramsSpec: { Progress: string };
}

// export interface FileDropperPreviewProps extends CommonProps {
//     sampleText?: string;
// }

export interface VisibilityMap {
    sampleText: boolean;
}

export type TypeShowAs = 'tilesPreview' | 'tilesNoPreview' | 'list';
export type TypeButtonStyle = 'glyphicon' | 'builtin';
export type TypeSaveMethod = 'saveDocument' | 'postRequest';

export interface FileDropperContainerProps extends CommonProps {
    dataFileEntity: string;
    dataNameAttr: string;
    dataTypeAttr: string;
    dataExtAttr: string;
    dataContextAssociation: string;
    dataAutoSave: boolean;
    dataSaveMethod: TypeSaveMethod;

    restrictionMaxFileSize: number;
    restrictionMaxFileCount: number;
    restrictionMimeType: string;

    verificationOnAcceptMicroflow: string;
    verificationEntity: string;
    verificationNameAttr: string;
    verificationTypeAttr: string;
    verificationExtAttr: string;
    verificationSizeAttr: string;
    verificationBeforeAcceptMicroflow: string;
    verificationBeforeAcceptNanoflow: Nanoflow;

    eventsAfterCommitMf: string;
    eventsAfterCommitNf: Nanoflow;
    eventsBeforeCommitMf: string;
    eventsBeforeCommitNf: Nanoflow;

    uiDeleteButtonStyle: TypeButtonStyle;
    uiDeleteButtonGlyph: string;
    uiSaveButtonStyle: TypeButtonStyle;
    uiSaveButtonGlyph: string;
    uiErrorButtonStyle: TypeButtonStyle;
    uiErrorButtonGlyph: string;

    uiShowPreview: boolean;
    uiShowImagePreviews: boolean;
    uiShowPreviewLabel: boolean;
    uiShowFileSize: boolean;

    uiHideProgressOnComplete: boolean;
    uiPbColorStrokeNormal: string;
    uiPbColorTrail: string;
    uiPbColorError: string;
    uiPbColorSuccess: string;

    textDropZone: string;
    textDropZoneMaximum: string;
    textDeleteFileConfirm: string;
    textFilesRejectedByServer: string;
    textFilesRejected: string;
    textFileRejectedSize: string;
}
