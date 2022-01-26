<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { ref, onMounted, reactive } from 'vue'
let color = ref('red')
let comp = reactive(HelloWorld)
onMounted(() => {
    document.querySelector('button')!.onclick = () => {
        let getRandomNum = (num:number) => Math.random() * num
        color.value = `rgba${getRandomNum(255)} ${getRandomNum(255)} ${getRandomNum(255)} ${getRandomNum(100)}`
    }
})
</script>

<template>
<!--    <img alt="Vue logo" src="./assets/logo.png" />-->
    <component :is="comp" />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
button {
    color: v-bind('color');
}
</style>
