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
} = require('./template');

module.exports = function (content) {
    // mutilfile folder path
    const vueVirtualFilePath = path.dirname(this.resourcePath);
    // vue component name
    const vueComponentName = path.basename(vueVirtualFilePath, '.vue');
    // virtual file folder
    const vueDir = path.dirname(vueVirtualFilePath);

    // css module file path
    const cssModuleFilePath = path.join(vueVirtualFilePath, 'module.css');
    const templateFilePath = path.join(vueVirtualFilePath, 'index.html');
    // css global file path
    const cssIndexFilePath = path.join(vueVirtualFilePath, 'index.css');
    const cssModuleExists = fs.existsSync(cssModuleFilePath);
    const cssIndexExists = fs.existsSync(cssIndexFilePath);

    try {
        let vueComponent = '';
        const template = htmlMarkerTemplate(fs.readFileSync(templateFilePath));
        const script = scriptTemplate(content);
        vueComponent = template + script;
        if (cssModuleExists)
            vueComponent += moduleCSSTemplate(fs.readFileSync(cssModuleFilePath));
        if (cssIndexExists)
            vueComponent += globalCSSTemplate(fs.readFileSync(cssIndexFilePath));

        return vueComponent;
    } catch (error) {
        console.log(error);
    }
};
