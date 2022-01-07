import { FileDropperContainerProps } from "../../typings/FileDropperProps";

export interface FileDropperTexts {
    DROPZONE: string;
    DROPZONEMAXIMUM: string;
    FILESREJECTED: string;
    FILESREJECTEDBYSERVER: string;
    FILERECTEDSIZE: string;
}

const defaultTexts: FileDropperTexts = {
    DROPZONE: "Click me to add a file!",
    DROPZONEMAXIMUM: "Maximum amount for files reached, please consider removing files",
    FILESREJECTED: "The following files are rejected:",
    FILESREJECTEDBYSERVER: "File: '%%FILENAME%%' rejected: %%ERROR%%",
    FILERECTEDSIZE: "File: '%%FILENAME%%' is rejected, file size exceeds %%MAXIZE%%"
};

export const getTexts = (props: FileDropperContainerProps): FileDropperTexts => {
    const texts = defaultTexts;

    if (props.textDropZone) {
        texts.DROPZONE = props.textDropZone;
    }

    if (props.textDropZoneMaximum) {
        texts.DROPZONEMAXIMUM = props.textDropZoneMaximum;
    }

    if (props.textFilesRejected) {
        texts.FILESREJECTED = props.textFilesRejected;
    }

    if (props.textFilesRejectedByServer) {
        texts.FILESREJECTEDBYSERVER = props.textFilesRejectedByServer;
    }

    if (props.textFileRejectedSize) {
        texts.FILERECTEDSIZE = props.textFileRejectedSize;
    }

    return texts;
};
