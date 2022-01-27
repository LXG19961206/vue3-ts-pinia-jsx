<script lang="tsx">
import { defineComponent } from 'vue'
import useStore from '../store/index'
import { Http } from '../common/util'
let http = new Http()

export default defineComponent({
    methods: {
        request () {
            let input = document.querySelector('input')
            let fd = new FormData()
            fd.append('file', input!.files![0])
            fd.append('type', '32323')
            console.log(fd.get('file'))
            http.get('http://119.3.227.27:29607/hello/429update', {
                altitude: 900,
                head: 'east'
            }).then(res => {
                console.log(res)
            })
        }
    },
    data () {
        return {
            url: '',
            file: '',
            color: '#fff'
        }
    },
    render () {
        let store = useStore()
        return (
            <div>
                <div>  { store.count }, {  store.countII }  </div>
                <audio src = { this.url }></audio>
                <button onClick = { () => this.request() } > add </button>
                <button onClick={ () => store.$patch({ count: 20 }) }> add to 20 </button>
                <input
                    v-model = { this.file }
                    type="file"
                />
            </div>
        )
    }
})
</script>
<style scoped>
a {
    color: v-bind(color);
}

label {
    margin: 0 0.5em;
    font-weight: bold;
}

code {
    background-color: #eee;
    padding: 2px 4px;
    border-radius: 4px;
    color: #304455;
}
</style>
