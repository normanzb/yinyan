import React, { useEffect, useState } from 'react'
import { encode } from 'js-base64';

export default (richModel, onUpdate = () => {}) => {
  if (!richModel) {
    return undefined
  }
  const valueCache = {}
  return new Proxy(richModel, {
    get: (target, name) => {
      const prop = target[name]

      if (!prop) {
        return
      }
      if (!prop.then) {
        return prop
      }

      const fetchPropValue = async () => {
        if (valueCache[name]) {
          return
        }

        const newValue = await prop

        if (newValue === valueCache[name]) {
          return
        }

        valueCache[name] = newValue

        onUpdate(encode(JSON.stringify(valueCache)))
      }

      fetchPropValue()

      const Comp = () => {
        const [value, setValue] = useState('')
        useEffect(() => {
          let dismounted = false;

          (async () => {
            await fetchPropValue()

            if (dismounted) {
              return
            }

            setValue(valueCache[name])
          })()

          return () => {
            dismounted = true
          }
        }, [])
        return <>
          {value}
        </>
      }
      const compInstance = <Comp />
      const ret = Object.create(compInstance)
      ret.valueOf = () => {
        return valueCache[name]
      }
      return ret
    }
  })
}