import { FileDropperContainerProps } from "../../typings/FileDropperProps";
import uuid from "uuid/v4";

export type TypeValidationSeverity = "fatal" | "warning";

export interface ValidateExtraProps {
    noFileSystemDocument?: boolean;
    noPersistentVerification?: boolean;
}

export class ValidationMessage {
    public id: string;
    public message: string;
    public dismissable: boolean;
    public fatal: boolean;

    constructor(message: string, type: TypeValidationSeverity = "fatal") {
        this.id = uuid();
        this.message = message;
        this.dismissable = type !== "fatal";
        this.fatal = type === "fatal";
    }
}

export const validateProps = (
    props: FileDropperContainerProps,
    extraProps: ValidateExtraProps = {}
): ValidationMessage[] => {
    const messages: ValidationMessage[] = [];
    const addValidation = (msg: string): void => {
        messages.push(new ValidationMessage(msg));
    };

    if (extraProps.noFileSystemDocument) {
        addValidation("[Data] :: Configured entity is not of type 'System.FileDocument'! Widget disabled");
    }

    if (extraProps.noPersistentVerification) {
        addValidation("[Verification] :: Verification entity can only be a non-persistable entity");
    }

    if (props.uiDeleteButtonStyle === "glyphicon" && props.uiDeleteButtonGlyph === "") {
        addValidation(
            "[UI] :: Delete button style is set to 'Glyphicon', but class is empty. Either set the class or use the built-in icon"
        );
    }

    if (props.uiSaveButtonStyle === "glyphicon" && props.uiSaveButtonGlyph === "") {
        addValidation(
            "[UI] :: Save button style is set to 'Glyphicon', but class is empty. Either set the class or use the built-in icon"
        );
    }

    if (props.uiErrorButtonStyle === "glyphicon" && props.uiErrorButtonGlyph === "") {
        addValidation(
            "[UI] :: Error button style is set to 'Glyphicon', but class is empty. Either set the class or use the built-in icon"
        );
    }

    if (
        props.verificationBeforeAcceptMicroflow !== "" &&
        props.verificationBeforeAcceptNanoflow &&
        props.verificationBeforeAcceptNanoflow.nanoflow
    ) {
        addValidation("[Verification] :: Only select a microflow OR nanoflow for verification, not both");
    }

    return messages;
};
