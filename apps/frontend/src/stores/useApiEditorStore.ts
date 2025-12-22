import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useApiEditorStore = defineStore('apiEditor', () => {
  const isDirty = ref(false)

  function setIsDirty(dirty: boolean) {
    isDirty.value = dirty
  }

  return {
    isDirty,
    setIsDirty,
  }
})
