const moduleCSSTemplate = (content) => `<style module>\n${content}\n</style>\n`;
const globalCSSTemplate = (content) => `<style>\n${content}\n</style>\n`;
const scriptTemplate = (content) => `<script>\n${content}\n</script>\n`;
const htmlMarkerTemplate = (content) => `<template>\n${content}\n</template>\n`;
module.exports = {
    moduleCSSTemplate,
    globalCSSTemplate,
    scriptTemplate,
    htmlMarkerTemplate,
};
