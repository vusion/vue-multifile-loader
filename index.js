const fs = require('fs');
const path = require('path');
const hash = require('hash-sum');
const loaderUtils = require('loader-utils');
const tryRequire = require('vusion-vue-loader/lib/utils/try-require');

const styleCompilerPath = require.resolve('vusion-vue-loader/lib/style-compiler');
const templateCompilerPath = require.resolve('vusion-vue-loader/lib/template-compiler');
const componentNormalizerPath = require.resolve('vusion-vue-loader/lib/component-normalizer');

// check whether default js loader exists
const hasBabel = !!tryRequire('babel-loader');
const hasBuble = !!tryRequire('buble-loader');

const defaultLang = {
    template: 'html',
    styles: 'css',
    script: 'js',
};

module.exports = function (content) {
    this.cacheable();
    const isServer = this.options.target === 'node';
    const isProduction = this.minimize || process.env.NODE_ENV === 'production';

    const options = Object.assign({
        esModule: true,
    }, this.options.vue, loaderUtils.getOptions(this));
    // disable esModule in inject mode
    // because import/export must be top-level
    if (options.inject)
        options.esModule = false;

    // #824 avoid multiple webpack runs complaining about unknown option
    this.options.__vueOptions__ = Object.assign({}, this.options.__vueOptions__, options);

    const vuePath = path.dirname(this.resourcePath);
    const vueName = path.basename(vuePath, '.vue');
    const vueDir = path.dirname(vuePath);

    const context = (this._compiler && this._compiler.context) || this.options.context || process.cwd();
    const shortFilePath = path.relative(context, vuePath).replace(/^(\.\.[\\/])+/, '');

    const moduleId = 'data-v-' + hash(isProduction ? (shortFilePath + '\n' + content) : shortFilePath);

    const cssLoaderOptions = '?' + JSON.stringify(Object.assign({
        sourceMap: !isProduction && this.sourceMap && options.cssSourceMap !== false,
        minimize: isProduction,
        modules: true,
        importLoaders: 3,
        localIdentName: '[hash:base64]',
    }, options.cssModules));

    const styleCompilerOptions = '?' + JSON.stringify({
        // a marker for vue-style-loader to know that this is an import from a vue file
        vue: true,
        id: moduleId,
        scoped: false,
        hasInlineConfig: !!options.postcss,
    });

    const bubleOptions = hasBuble && options.buble ? '?' + JSON.stringify(options.buble) : '';
    const bubleTemplateOptions = Object.assign({}, options.buble);
    bubleTemplateOptions.transforms = Object.assign({}, bubleTemplateOptions.transforms);
    bubleTemplateOptions.transforms.stripWithFunctional = false;

    const templateCompilerOptions = '?' + JSON.stringify({
        id: moduleId,
        transformToRequire: options.transformToRequire,
        preserveWhitespace: options.preserveWhitespace,
        buble: bubleTemplateOptions,
        // only pass compilerModules if it's a path string
        compilerModules: typeof options.compilerModules === 'string' ? options.compilerModules : undefined,
    });

    const getRequirePath = (type, filePath) => {
        let loader = loaders[type];
        if (preLoaders[type])
            loader = loader + '!' + preLoaders[type];
        if (postLoaders[type])
            loader = postLoaders[type] + '!' + loader;
        return loaderUtils.stringifyRequest(this, '!!' + loader + '!' + filePath);
    };
    const getRequire = (type, filePath) => `require(${getRequirePath(type, filePath)})`;
    const getImport = (type, filePath) => `import __vue_${type}__ from ${getRequirePath(type, filePath)};`;
    const getNamedExport = (type, filePath) => `export * from ${getRequirePath(type, filePath)};`;

    const getCSSExtractLoader = () => {
        let extractor;
        const op = options.extractCSS;
        // extractCSS option is an instance of ExtractTextPlugin
        if (typeof op.extract === 'function')
            extractor = op;
        else {
            extractor = tryRequire('extract-text-webpack-plugin');
            if (!extractor)
                throw new Error('[vue-multifile-loader] extractCSS: true requires extract-text-webpack-plugin as a peer dependency.');
        }

        return extractor.extract({
            use: 'css-loader' + cssLoaderOptions,
            fallback: 'vue-style-loader',
        });
    };

    const stringifyLoaders = (loaders) => loaders.map((obj) => {
        if (obj && typeof obj === 'object' && typeof obj.loader === 'string')
            return obj.loader + (obj.options ? '?' + JSON.stringify(obj.options) : '');
        else
            return obj;
    }).join('!');

    // check if there are custom loaders specified via
    // webpack config, otherwise use defaults
    const preLoaders = options.preLoaders || {};
    const postLoaders = options.postLoaders || {};
    const midLoaders = options.midLoaders || {};

    const defaultLoaders = {
        html: templateCompilerPath + templateCompilerOptions,
        css: (options.extractCSS ? stringifyLoaders(getCSSExtractLoader()) : 'vue-style-loader!css-loader' + cssLoaderOptions)
            + '!' + (midLoaders.css ? midLoaders.css + '!' : '') + styleCompilerPath + styleCompilerOptions,
        /* eslint-disable no-nested-ternary */
        js: hasBuble ? ('buble-loader' + bubleOptions) : hasBabel ? 'babel-loader' : '',
    };
    const loaders = Object.assign({}, defaultLoaders, options.loaders);

    /**
     * Start to output
     */
    let outputs = [];

    const needsHotReload = !isServer && !isProduction && options.hotReload !== false;
    if (needsHotReload)
        outputs.push('var disposed = false;');

    // add requires for styles
    let cssModules;

    // const files = fs.readdirSync(vuePath);
    // const cssFiles = files.filter((file) => file.endsWith('.css'));
    const cssModuleFilePath = path.join(vuePath, 'module.css');
    const cssIndexFilePath = path.join(vuePath, 'index.css');
    const cssModuleExists = fs.existsSync(cssModuleFilePath);
    const cssIndexExists = fs.existsSync(cssIndexFilePath);

    if (cssModuleExists || cssIndexExists) {
        const styleInjectionCodes = ['function injectStyle (ssrContext) {'];
        if (needsHotReload)
            styleInjectionCodes.push('    if (disposed) return;');
        if (isServer)
            styleInjectionCodes.push('var i;');

        const handleStyle = (filePath, moduleName) => {
            let requireString = getRequire('css', filePath);

            const hasStyleLoader = true;
            const hasVueStyleLoader = true;

            // vue-style-loader exposes inject functions during SSR so they are always called
            const invokeStyle = isServer && hasVueStyleLoader ? (code) => `;(i=${code},i.__inject__&&i.__inject__(ssrContext),i)\n` : (code) => `  ${code}\n`;

            // @TODO: Support other moduleName
            // const moduleName = '$style';
            // setCSSModule
            if (moduleName) {
                if (!cssModules) {
                    cssModules = {};
                    outputs.push('var cssModules = {};');
                }

                if (moduleName in cssModules) {
                    this.emitError(`CSS module name "${moduleName}" is not unique!`);
                    styleInjectionCodes.push(invokeStyle(requireString));
                } else {
                    cssModules[moduleName] = true;

                    // `(vue-)style-loader` exposes the name-to-hash map directly
                    // `css-loader` exposes it in `.locals`
                    // add `.locals` if the user configured to not use style-loader.
                    if (!hasStyleLoader)
                        requireString += '.locals';

                    styleInjectionCodes.push(`cssModules['${moduleName}'] = ${requireString};`);

                    if (!needsHotReload)
                        styleInjectionCodes.push(invokeStyle(`this['${moduleName}'] = cssModules['${moduleName}']`));
                    else {
                        // handle hot reload for CSS modules.
                        // we store the exported locals in an object and proxy to it by
                        // defining getters inside component instances' lifecycle hook.
                        styleInjectionCodes.push(invokeStyle(`cssModules['${moduleName}']`));
                        styleInjectionCodes.push(`Object.defineProperty(this, '${moduleName}', {
                            get: function () { return cssModules['${moduleName}'] },
                            configurable: true,
                        });`);

                        const requirePath = getRequirePath('css', filePath);

                        outputs.push(`
                            module.hot && module.hot.accept([${requirePath}], function () {
                                // 1. check if style has been injected
                                var oldLocals = cssModules['${moduleName}'];
                                if (!oldLocals) return;
                                // 2. re-import (side effect: updates the <style>)
                                var newLocals = ${requireString};
                                // 3. compare new and old locals to see if selectors changed
                                if (JSON.stringify(newLocals) === JSON.stringify(oldLocals)) return;
                                // 4. locals changed. Update and force re-render.
                                cssModules['${moduleName}'] = newLocals;
                                require('vue-hot-reload-api').rerender('${moduleId}');
                            });
                            `);
                    }
                }
            } else
                styleInjectionCodes.push(invokeStyle(requireString));
        };

        cssModuleExists && handleStyle(cssModuleFilePath, '$style');
        cssIndexExists && handleStyle(cssIndexFilePath, false);

        styleInjectionCodes.push('}');
        outputs = outputs.concat(styleInjectionCodes);
    }

    // we require the component normalizer function, and call it like so:
    // normalizeComponent(
    //   scriptExports,
    //   compiledTemplate,
    //   functionalTemplate,
    //   injectStyles,
    //   scopeId,
    //   moduleIdentifier (server only)
    // )
    const componentRequirePath = loaderUtils.stringifyRequest(this, '!' + componentNormalizerPath);
    outputs.push(`var normalizeComponent = require(${componentRequirePath});`);

    // <script>
    outputs.push('/* script */');
    const jsFilePath = this.resourcePath;
    if (options.esModule) {
        outputs.push(getNamedExport('js', jsFilePath));
        outputs.push(getImport('js', jsFilePath));
    } else
        outputs.push('var __vue_js__ = ' + getRequire('js', jsFilePath));

    // inject loader interop
    if (options.inject)
        outputs.push('__vue_js__ = __vue_js__(injections)');

    // <template>
    outputs.push('/* template */');
    // add require for template
    const htmlFilePath = path.join(vuePath, 'index.html');
    const htmlExists = fs.existsSync(htmlFilePath);
    if (htmlExists) {
        if (options.esModule)
            outputs.push(getImport('html', htmlFilePath));
        else
            outputs.push('var __vue_html__ = ' + getRequire('html', htmlFilePath));
    } else
        outputs.push('var __vue_html__ = null');

    // template functional
    outputs.push('/* template functional */');
    outputs.push('var __vue_template_functional__ = false');

    // style
    outputs.push('/* styles */');
    outputs.push('var __vue_css__ = ' + (cssModuleExists || cssIndexExists ? 'injectStyle' : 'null'));

    // @TODO: scopeId
    outputs.push('/* scopeId */');
    outputs.push('var __vue_scopeId__ = null');

    // moduleIdentifier (server only)
    outputs.push('/* moduleIdentifier (server only) */');
    outputs.push('var __vue_module_identifier__ = ' + (isServer ? JSON.stringify(hash(this.request)) : 'null'));

    // close normalizeComponent call
    outputs.push('var Component = normalizeComponent(__vue_js__, __vue_html__, __vue_template_functional__, __vue_css__, __vue_scopeId__, __vue_module_identifier__)');

    // development-only code
    if (!isProduction) {
        // add filename in dev
        outputs.push(`Component.options.__file = ${JSON.stringify(jsFilePath)};`);
        outputs.push(`Component.options.__moduleId = ${JSON.stringify(moduleId)};`);
    }

    // @TODO: add requires for customBlocks

    if (!options.inject) {
        // hot reload
        if (needsHotReload) {
            outputs.push(`
                /* hot reload */
                if (module.hot) {
                    (function () {
                        var hotAPI = require('vue-hot-reload-api');
                        hotAPI.install(require('vue'), false);
                        if (!hotAPI.compatible) return;
                        module.hot.accept();
            `);

            if (process.env.DEBUG) {
                outputs.push(`
                    let Ctor = Component.options._Ctor;
                    if (Ctor) {
                        console.warn('[vue-multifile-loader]', Component.options.name, 'Ctor will be removed.');
                        Ctor.length > 1 && console.warn('[vue-multifile-loader] Ctor.length > 1');

                        // Ctor = Ctor[0];
                        // if (Ctor.extendOptions !== Component.options);
                    }
                `);
            }

            outputs.push(`
                        delete Component.options._Ctor;
                        if (!module.hot.data) {
                            hotAPI.createRecord('${moduleId}', Component.options);
                        } else {`
            );
            // update
            if (cssModules) {
                outputs.push(`if (module.hot.data.cssModules && Object.keys(module.hot.data.cssModules) !== Object.keys(cssModules)) {
                    delete Component.options._Ctor;
                }`);
            }
            outputs.push(`
                hotAPI.reload('${moduleId}', Component.options);
            }`);
            // dispose
            outputs.push('module.hot.dispose(function (data) {' + (cssModules ? 'data.cssModules = cssModules;' : '') + 'disposed = true; });');
            outputs.push('})()}');
        }

        // final export
        if (options.esModule)
            outputs.push(`export default Component.exports;`);
        else
            outputs.push(`module.exports = Component.exports;`);
    } else {
        // inject-loader support
        return `/* dependency injection */
            module.exports = function (injections) {
                ${outputs.join('\n')}
                return Component.exports;
            };`;
    }
    // done
    return outputs.join('\n');
};
