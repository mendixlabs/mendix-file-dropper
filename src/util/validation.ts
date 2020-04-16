import { FileDropperContainerProps } from "../../typings/FileDropperProps";
import { ValidationMessage } from "@jeltemx/mendix-react-widget-utils/lib/validation";

export type TypeValidationSeverity = "fatal" | "warning";

export interface ValidateExtraProps {
    noFileSystemDocument?: boolean;
    noPersistentVerification?: boolean;
}

export const validateProps = (
    props: FileDropperContainerProps,
    extraProps: ValidateExtraProps = {}
): ValidationMessage[] => {
    const messages: ValidationMessage[] = [];
    const addValidation = (msg: string): void => {
        messages.push(new ValidationMessage(msg));
    };
    const conditionalValidation = (condition: boolean, category: string, msg: string): void => {
        if (condition) {
            messages.push(new ValidationMessage(`[${category}] :: ${msg}`));
        }
    };
    const glyphIconError = (button: string) =>
        `${button} button style is set to 'Glyphicon', but class is empty. Either set the class or use the built-in icon`;

    if (extraProps.noFileSystemDocument) {
        addValidation("[Data] :: Configured entity is not of type 'System.FileDocument'! Widget disabled");
    }

    if (extraProps.noPersistentVerification) {
        addValidation("[Verification] :: Verification entity can only be a non-persistable entity");
    }

    conditionalValidation(
        props.uiDeleteButtonStyle === "glyphicon" && props.uiDeleteButtonGlyph === "",
        "UI",
        glyphIconError("Delete")
    );

    conditionalValidation(
        props.uiSaveButtonStyle === "glyphicon" && props.uiSaveButtonGlyph === "",
        "UI",
        glyphIconError("Save")
    );

    conditionalValidation(
        props.uiErrorButtonStyle === "glyphicon" && props.uiErrorButtonGlyph === "",
        "UI",
        glyphIconError("Error")
    );

    conditionalValidation(
        props.verificationBeforeAcceptMicroflow !== "" &&
            !!(props.verificationBeforeAcceptNanoflow && props.verificationBeforeAcceptNanoflow.nanoflow),
        "Verification",
        "Only select a microflow OR nanoflow for verification, not both"
    );

    return messages;
};
