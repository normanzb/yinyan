import React, { useMemo } from 'react'
import './styles.less'
import reactifyRichModel from '../../reactifyRichModel'
import { getUnitInPx } from '../../config'

const Song = React.memo(({ song, style }) => {
  const renderable = useMemo(() => reactifyRichModel(song), [song])

  if (!song) {
    return null
  }

  return <div className='song' style={style}>
    <div className='title'>{renderable.title}</div>
    <div>{renderable.displayArtist}</div>
  </div>
})

Object.defineProperty(Song, 'HEIGHT', {
	get: () => {
		return getUnitInPx() * 3
	}
})

export default Song
