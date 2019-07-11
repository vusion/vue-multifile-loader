const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// const moduleResolverFac = require('vue-cli-plugin-vusion/src-reborn/scenary/module-resolver/index');
// const postcssPluginsFac = require('vue-cli-plugin-vusion/src-reborn/scenary/postcss/plugins');
module.exports = {
    entry: './test/webpack/index.js',
    output: {
        filename: 'main.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.vue[\\/]index\.js$/,
                use: [
                    'vue-loader',
                    {
                        loader: path.resolve(__dirname, 'src/loader.js'),
                    },
                ],
            },
            {
                test: /\.vue$/,
                use: [
                    'vue-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            // enable CSS Modules
                            modules: true,
                            // customize generated class names
                            // localIdentName: '[local]_[hash:base64:8]',
                        },
                    },
                    // {
                    //     loader: 'postcss-loader',

                    // },

                ],
            },
            {
                test: /\.js$/,
                exclude(filename) {
                    console.log(filename);
                    return /(node_modules|bower_components)/.test(filename);
                },
                use: {
                    loader: 'babel-loader',

                    options: {
                        plugins: [
                            '@babel/plugin-syntax-dynamic-import',
                        ],
                    },
                },
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[hash:16].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    // plugins: [
    //   new BundleAnalyzerPlugin()
    // ],
    optimization: {
        minimize: false,
    },
    plugins: [
        // make sure to include the plugin for the magic
        new VueLoaderPlugin(),
    ],
};
