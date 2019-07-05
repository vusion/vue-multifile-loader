const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: './test/webpack/index.js',
    output: {
        filename: 'main.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            { test: /\.html$/, use: 'vue-template-loader' },
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
                    'css-loader',
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
