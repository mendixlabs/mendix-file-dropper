import { FileDropperContainerProps } from "../../typings/FileDropperProps";

export interface FileDropperTexts {
    DROPZONE: string;
    DROPZONEMAXIMUM: string;
}

const defaultTexts: FileDropperTexts = {
    DROPZONE: "Click me to add a file!",
    DROPZONEMAXIMUM: "Maximum amount for files reached, please consider removing files"
};

export const getTexts = (props: FileDropperContainerProps): FileDropperTexts => {
    const texts = defaultTexts;

    if (props.textDropZone && props.textDropZone !== "") {
        texts.DROPZONE = props.textDropZone;
    }

    if (props.textDropZoneMaximum && props.textDropZoneMaximum !== "") {
        texts.DROPZONEMAXIMUM = props.textDropZoneMaximum;
    }

    return texts;
};
