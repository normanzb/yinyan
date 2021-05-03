import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import reactifyRichModel from './reactifyRichModel'

export default model => {
	const [, triggerUpdate] = useState()
  const dismountedRef = useRef(false)
  const handleDataRetrieved = useCallback((updateInfo) => {
    if (dismountedRef.current === true) {
      return
    }
    triggerUpdate(updateInfo)
  }, [triggerUpdate, dismountedRef])
  useEffect(() => {
    return () => {
      dismountedRef.current = true
    }
  })
  return useMemo(() => reactifyRichModel(model, handleDataRetrieved), [model, handleDataRetrieved])
}
