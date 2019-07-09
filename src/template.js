const moduleCSSTemplate = (content) => `<style module>\n${content}\n</style>\n`;
const globalCSSTemplate = (content) => `<style>\n${content}\n</style>\n`;
const scriptTemplate = (content) => `<script>\n${content}\n</script>\n`;
const htmlMarkerTemplate = (content) => `<template>\n${content}\n</template>\n`;
const moduleCSSPathTemplate = (path) => `<style src="${path}" module></style>`;
const htmlMarkerPathTemplate = (path) => `<template src="${path}"></template>\n`;
const scriptPathTemplate = (path) => `<script src="${path}"></script>\n`;
module.exports = {
    moduleCSSTemplate,
    globalCSSTemplate,
    scriptTemplate,
    htmlMarkerTemplate,
    moduleCSSPathTemplate,
    htmlMarkerPathTemplate,
    scriptPathTemplate,
};
