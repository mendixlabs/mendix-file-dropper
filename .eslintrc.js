const base = require("./node_modules/@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json");

base["rules"]["@typescript-eslint/explicit-member-accessibility"] = "off";
base["rules"]["no-console"] = "warn";
base["rules"]["@typescript-eslint/member-ordering"] = "warn";
base["rules"]["@typescript-eslint/no-empty-function"] = "warn";
base["rules"]["no-useless-call"] = "off";
base["rules"]["@typescript-eslint/ban-ts-ignore"] = "off";
base["rules"]["require-atomic-updates"] = "off";
base["rules"]["@typescript-eslint/no-inferrable-types"] = "off";
base["rules"]["@typescript-eslint/interface-name-prefix"] = "off";

module.exports = {
    ...base,
};
