import { withNaming } from "@bem-react/classname";

const widgetClassName = "filedropper";
export const classes = withNaming({ e: "__", m: "--", v: "_" })(widgetClassName);
