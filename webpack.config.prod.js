const merge = require("webpack-merge");
const webpack = require("webpack");
const path = require("path");
const baseConfig = require("./node_modules/@mendix/pluggable-widgets-tools/configs/webpack.config.prod.js");//Can also be webpack.config.prod.js
const pkg = require('./package.json');

const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const args = process.argv.slice(2);

// We're doing dirty hacking, because our camel case stuff doesn't transpile nicely to ES5. Need another solution, but this works in IE11
// TODO: Just use my own config
baseConfig[0].module.rules[1].exclude = /node_modules\/(?!(filesize)\/).*/
baseConfig[0].module.rules[1].use.options.presets[0] = [
    '@babel/preset-env',
    {
        "targets": {
            "browsers": ["last 2 versions", "ie >= 11"],
        },
        "modules": false,
        // "useBuiltIns": "usage",
        // "corejs": "3"
    }
]
// baseConfig[1].module.rules[1].exclude = /node_modules\/(?!(@thi.ng)\/).*/
baseConfig[1].module.rules[1].use.options.presets[0] = [
    '@babel/preset-env',
    {
        "targets": {
            "browsers": ["last 2 versions", "ie >= 11"],
        },
        "modules": false,
        // "useBuiltIns": "usage",
        // "corejs": "3"
    }
]
baseConfig[1].module.rules[0].options = { transpileOnly: true }

const terserPlugin = new TerserPlugin({
    cache: true,
    parallel: true,
    terserOptions: {
        ecma: undefined,
        warnings: false,
        parse: {},
        compress: {
            passes: 2
        },
        mangle: true, // Note `mangle.properties` is `false` by default.
        module: false,
        output: {
            comments: false,
            beautify: false,
            preamble: `/* FileDropper for Mendix || Version ${pkg.version} || Apache 2 LICENSE || Developer: ${pkg.author} || Please report any issues here: https://github.com/mendixlabs/mendix-file-dropper/issues */\n`
            // comments: false
        },
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false,
    },
});

const customConfig = {
    // Custom configuration goes here
    devtool: false,
    optimization: {
        minimizer: [
            terserPlugin
        ]
    },
    plugins: [
        // We only include the moment locale for en-gb, as this is not used in a lot of places and we don't need all the locales
        // new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-gb/)
    ],
    // We add this to further slim down the package
    resolve: {
        extensions: [".mjs", ".json", ".ts", ".js", ".tsx", ".jsx"],
        alias: {
            "react-icons/fa": path.join(__dirname, "node_modules/react-icons/fa/index.esm"),
            "react-icons/ti": path.join(__dirname, "node_modules/react-icons/ti/index.esm"),
            //"filesize": path.join(__dirname, "node_modules/filesize/lib/filesize.esm.js")
        }
    }
};

if (args.length === 5 && args[4] === "--analyze") {
    customConfig.plugins.push(new BundleAnalyzerPlugin());
}

const previewConfig = {
    // Custom configuration goes here
    // devtool: false,
    // plugins: [
    // ],
    // optimization: {
    //     // minimizer: [
    //     //     terserPlugin
    //     // ]
    // },
    resolve: {
        extensions: [".mjs", ".json", ".ts", ".js", ".tsx", ".jsx"],
        alias: {
            "react-icons/fa": path.join(__dirname, "node_modules/react-icons/fa/index.esm"),
            "react-icons/ti": path.join(__dirname, "node_modules/react-icons/ti/index.esm"),
            //"filesize": path.join(__dirname, "node_modules/filesize/lib/filesize.esm.js")
        }
    },
    externals: [
        /^mendix\//,
        "react",
        "react-dom"
    ]
};

if (args.length === 5 && args[4] === "--analyze") {
    // previewConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = [merge(baseConfig[0], customConfig), merge(baseConfig[1], previewConfig)];
