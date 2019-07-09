const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

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
