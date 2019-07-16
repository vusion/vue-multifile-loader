import { myComponent } from './component.vue';
export default {
    // components: {
    //     myComponent,
    // },
    extends: myComponent,
    data() {
        return {
            a: 'vvvv',
        };
    },
};

