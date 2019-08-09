/**
 * Combine js, html, css in one folder into one Vue File
 * entry xxxx.vue/index.js
 */

const fs = require('fs');
const path = require('path');
const templates = require('./templates');

module.exports = function (content) {
    // Multifile folder path
    const vueFilePath = path.dirname(this.resourcePath);
    this.resourcePath = vueFilePath;

    let result = '';

    if (fs.existsSync(path.join(vueFilePath, './index.html')))
        result += templates.templatePath('./index.html');

    const script = templates.script(content);
    result += script;

    if (fs.existsSync(path.join(vueFilePath, './module.css')))
        result += templates.cssModulePath('./module.css');
    if (fs.existsSync(path.join(vueFilePath, './index.css')))
        result += templates.cssNormalPath('./index.css');

    return result;
};
