import { myComponent } from '../component.vue';
export default {
    extends: myComponent,
    data() {
        console.log('test-extend');
        return {
            a: 'vvvv',
        };
    },
};
