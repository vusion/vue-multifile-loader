import { myComponent } from './component.vue';
import Vue from 'vue';
console.log(document.getElementById('app'));
new Vue({
    render: (h) => h(myComponent),
}).$mount('#app');
