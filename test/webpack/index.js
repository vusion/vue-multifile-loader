import Vue from 'vue';
// import * as CloudUI from 'cloud-ui.vusion';
// import { installComponents } from 'vusion-utils';
// installComponents(CloudUI, Vue);

// Vue.config.productionTip = false;
// console.log(document.getElementById('app'));

import myComponent from './test-extend.vue';

new Vue({
    render: (h) => h(myComponent),
}).$mount('#app');
