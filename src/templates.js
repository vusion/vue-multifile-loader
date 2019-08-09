module.exports = {
    script: (content) => `<script>\n${content}\n</script>\n`,
    scriptPath: (path) => `<script src="${path}"></script>\n`,
    template: (content) => `<template>\n${content}\n</template>\n`,
    templatePath: (path) => `<template src="${path}"></template>\n`,
    style: (content) => `<style>\n${content}\n</style>\n`,
    stylePath: (path) => `<style src="${path}"></style>\n`,
    styleModule: (content) => `<style module>\n${content}\n</style>\n`,
    styleModulePath: (path) => `<style module src="${path}"></style>\n`,
};
