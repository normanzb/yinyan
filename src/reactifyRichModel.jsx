import React, { useEffect, useState } from 'react'

export default (richModel) => {
  if (!richModel) {
    return undefined
  }
  return new Proxy(richModel, {
    get: (target, name) => {
      const prop = target[name]
      if (!prop) {
        return
      }
      if (!prop.then) {
        return prop
      }

      const Comp = () => {
        const [value, setValue] = useState('')
        useEffect(() => {
          let dismounted = false;

          (async () => {
            const v = await prop
            if (dismounted) {
              return
            }
            setValue(v)
          })()

          return () => {
            dismounted = true
          }
        }, [])
        return <>
          {value}
        </>
      }
      return <Comp />
    }
  })
}