<template>
    <div>
        <my-component></my-component>
    </div>
</template>

<script>
import {myComponent} from './component.vue';
export default {
    components: {
        myComponent,
    },
    data(){
        return {
            a: 'vvvv'
        }
    }
}
</script>

<style module>
.root{
    color: red;
}
</style>
