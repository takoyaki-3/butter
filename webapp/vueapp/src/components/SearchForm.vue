<template>
  <div class="form-container">
    <h2>Bus Stop Finder</h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="name">Name:</label>
        <input v-model="form.name" type="text" id="name" required>
      </div>
      <div class="form-group">
        <label for="latitude">Latitude:</label>
        <input v-model="form.latitude" type="text" id="latitude" required>
      </div>
      <div class="form-group">
        <label for="longitude">Longitude:</label>
        <input v-model="form.longitude" type="text" id="longitude" required>
      </div>
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        latitude: '',
        longitude: ''
      }
    }
  },
  methods: {
    submitForm() {
      // Here we emit an event and pass the form data to the parent component
      this.$emit('formSubmitted', this.form);
    }
  }
}
</script>

<style scoped>
.form-container {
  margin-right: 60px;
}

.form-group {
  margin-bottom: 20px;
}
</style>
