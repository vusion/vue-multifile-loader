const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const genId = require('vue-loader/lib/gen-id');
const templateCompilerLoader = require.resolve('vue-loader/lib/template-compiler');
const styleRewriterLoader = require.resolve('vue-loader/lib/style-rewriter');

module.exports = function (content) {
    this.cacheable();
    const query = loaderUtils.parseQuery(this.query);
    const options = this.options.__vueOptions__ = Object.assign({}, this.options.vue, query);

    const vuePath = path.dirname(this.resourcePath);
    const vueName = path.basename(vuePath, '.vue');
    const vueDir = path.dirname(vuePath);
    const moduleId = 'data-v-' + genId(vuePath);
    let moduleName;

    const isServer = this.options.target === 'node';
    const isProduction = this.minimize || process.env.NODE_ENV === 'production';
    const needCssSourceMap = !isProduction && this.sourceMap && options.cssSourceMap !== false;

    let outputs = [];
    const exports = [];

    // add require for css
    let cssModuleFilePath = path.join(vuePath, 'module.css');
    let cssIndexFilePath = path.join(vuePath, 'index.css');
    // this.addDependency(cssModuleFilePath);
    // this.addDependency(cssIndexFilePath);
    if (fs.existsSync(cssModuleFilePath)) {
        // @todo: only support `$style` moduleName
        moduleName = '$style';
        const cssLoaderQuery = JSON.stringify({
            sourceMap: needCssSourceMap,
            modules: true,
            importLoaders: 1,
            localIdentName: vueName + '_[local]',
        });

        const requireString = loaderUtils.stringifyRequest(this, `!!vue-style-loader?insertAt=byId!css-loader?${cssLoaderQuery}!${styleRewriterLoader}?id=${moduleId}!import-global-loader!${cssModuleFilePath}`);
        outputs.push('\n/* styles */');
        outputs.push('var __vue_styles__ = {};');
        outputs.push(`__vue_styles__['${moduleName}'] = require(${requireString});`);
    } else if (fs.existsSync(cssIndexFilePath)) {
        const requireString = loaderUtils.stringifyRequest(this, `!!vue-style-loader?insertAt=byId!css-loader?importLoaders&${needCssSourceMap ? 'sourceMap' : ''}!${styleRewriterLoader}?id=${moduleId}!import-global-loader!${cssIndexFilePath}`);
        outputs.push('\n/* styles */');
        outputs.push(`require(${requireString});`);
    }
    // @todo: scoped

    // add require for js
    const jsFilePath = this.resourcePath;
    {
        const requireString = loaderUtils.stringifyRequest(this, `!${jsFilePath}`); // set babel-loader as a pre-loader

        outputs.push('\n/* script */');
        outputs.push(`var __vue_exports__ = require(${requireString});`);

        const checkNamedExports = `if (Object.keys(__vue_exports__).some(function (key) { return key !== "default" && key !== "__esModule" })) {
            console.error("named exports are not supported in *.vue files.");
        }`;

        exports.push(`
            var __vue_options__ = __vue_exports__ = __vue_exports__ || {};
            // ES6 modules interop
            if (typeof __vue_exports__.default === 'object' || typeof __vue_exports__.default === 'function') {
                ${isProduction ? '' : checkNamedExports}
                __vue_options__ = __vue_exports__ = __vue_exports__.default;
            }
            // constructor export interop
            if (typeof __vue_options__ === 'function') {
                __vue_options__ = __vue_options__.options;
            }
            `);

            // add filename in dev
            // (isProduction ? '' : ('__vue_options__.__file = ' + JSON.stringify(jsFilePath))) + '\n'
            // exports.push(`if (typeof __vue_options__.name === 'undefined') {
            //     __vue_options__.name = ${JSON.stringify(path.parse(jsFilePath).name)};
            // }`)
    }

    // add require for html
    const htmlFilePath = path.join(vuePath, 'index.html');
    // this.addDependency(htmlFilePath);
    if (fs.existsSync(htmlFilePath)) {
        const requireString = loaderUtils.stringifyRequest(this, `!!${templateCompilerLoader}?id=${moduleId}!${htmlFilePath}`);

        outputs.push('\n/* template */');
        outputs.push(`var __vue_template__ = require(${requireString});`);

        // attach render functions to exported options
        exports.push(`
            __vue_options__.render = __vue_template__.render;
            __vue_options__.staticRenderFns = __vue_template__.staticRenderFns;
        `);
    }

    if (moduleName) {
        exports.push(`
            if (!__vue_options__.computed) __vue_options__.computed = {};
            var __vue_style__ = __vue_styles__['${moduleName}'];
            // extend $styles from super
            if (__vue_options__.computed['${moduleName}'])
                __vue_style__ = Object.assign(__vue_options__.computed['${moduleName}'](), __vue_style__);
            __vue_options__.computed['${moduleName}'] = function () { return __vue_style__; };
        `);
    }

    if (!query.inject) {
        outputs = outputs.concat(exports);
        // hot reload
        if (!isServer && !isProduction) {
            outputs.push(`
                /* hot reload */
                if (module.hot) {
                    (function () {
                        var hotAPI = require('vue-hot-reload-api');
                        hotAPI.install(require('vue'), false);
                        if (!hotAPI.compatible) return;
                        module.hot.accept();
                        if (!module.hot.data) {
                            hotAPI.createRecord('${moduleId}', __vue_options__);
                        } else {
                            hotAPI.reload('${moduleId}', __vue_options__);
                        }
                    })();
                }
            `);
        }
        // check functional components used with templates
        if (!isProduction) {
            outputs.push(`
                if (__vue_options__.functional && typeof __vue_template__ !== 'undefined') {
                    console.error('[vue-multifile-loader] ${vuePath}: functional components are not supported with template, they should use render funtions.');
                }
            `);
        }
        // final export
        if (options.esModule) {
            outputs.push(`
                exports.__esModule = true;
                exports['default'] = __vue_exports__;
            `);
        } else
            outputs.push(`module.exports = __vue_exports__;`);
    } else {
        // inject-loader support
        outputs.push(`
            /* dependency injection */
            module.exports = function (injections) {
                __vue_exports__ = __vue_exports__(injections);
        `);
        outputs = outputs.concat(exports);
        outputs.push('return __vue_exports__\n}');
    }

    return outputs.join('\n');
}
