
<template>
    <div id="tag">
        <TagInput />
    </div>
</template>

<script>
import TagInput from './components/TagInput.vue'
import Butter from 'butter-lib/dist.js';

export default {
    name: 'TagItem',
    components: {
        TagInput
    },
    data: function () {
        return {
            stop_lists: [],
        };
    },
    methods: {
    },
    // mounted function is same as before
    mounted: async function () {
        await Butter.init()
        console.log(Butter)
    }
}
</script>

<style></style>
    