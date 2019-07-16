/**
 * combine js, html, css in one folder into one Vue File
 * entry xxxx.vue/index.js
 */

const fs = require('fs');
const path = require('path');
const {
    moduleCSSTemplate,
    globalCSSTemplate,
    scriptTemplate,
    htmlMarkerTemplate,
    moduleCSSPathTemplate,
    htmlMarkerPathTemplate,
    scriptPathTemplate,
} = require('./template');
// const loaderUtils = require('loader-utils');
module.exports = function (content) {
    // mutilfile folder path
    const vueVirtualFilePath = path.dirname(this.resourcePath);
    // vue component name
    // const vueComponentName = path.basename(vueVirtualFilePath, '.vue');
    // virtual file folder
    // const vueDir = path.dirname(vueVirtualFilePath);
    this.resourcePath = vueVirtualFilePath;
    // loaderUtils.stringifyRequest(this, vueVirtualFilePath);
    // css module file path
    const cssModuleFilePath = path.join(vueVirtualFilePath, 'module.css');
    const templateFilePath = path.join(vueVirtualFilePath, 'index.html');
    const templateFileExists = fs.existsSync(templateFilePath);
    // css global file path
    const cssIndexFilePath = path.join(vueVirtualFilePath, 'index.css');
    const cssModuleExists = fs.existsSync(cssModuleFilePath);
    const cssIndexExists = fs.existsSync(cssIndexFilePath);
    try {
        let vueComponent = '';
        if (templateFileExists) {
            // vueComponent += htmlMarkerTemplate(fs.readFileSync(templateFilePath));
            vueComponent += htmlMarkerPathTemplate('./index.html');
        }
        const script = scriptTemplate(content);
        vueComponent += script; // scriptPathTemplate('./index.js');
        if (cssModuleExists) {
            // vueComponent += moduleCSSTemplate(fs.readFileSync(cssModuleFilePath));
            vueComponent += moduleCSSPathTemplate('./module.css');
        }

        if (cssIndexExists)
            vueComponent += globalCSSTemplate(fs.readFileSync(cssIndexFilePath));
        return vueComponent;
    } catch (error) {
        console.log(error);
    }
};
