# vue-multifile-loader

## Equivalent

```
/sample.vue
    index.js
    index.html
    index.css
```
<=> sample.vue(Single File)

## More Features

```
index.md
test.js
module.css
```

## Webpack Config

``` javascript
module: {
    rules: [
        { test: /\.vue[\\/]index\.js$/, loader: 'vue-multifile-loader', options: same_as_vue_loader },
    ],
}
```
