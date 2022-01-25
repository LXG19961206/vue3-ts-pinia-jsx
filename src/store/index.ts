import {defineStore} from "pinia"
import { reactive, ref, computed } from 'vue'
export default defineStore('store', () => {
    let count = ref(0),
        add = () => count.value += 1,
        countII = computed(() => count.value * 2)
    return { count, add, countII }
})

