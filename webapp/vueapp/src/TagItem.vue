
<template>
    <div id="tag">
        <TagInput />
    </div>
</template>

<script>
import TagInput from './components/TagInput.vue'

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
    }
}
</script>

<style></style>
    