import React from 'react'
import './styles.less'
import useReactifyRichModel from '../../useReactifyRichModel'
import { getUnitInPx } from '../../config'
import { Link } from "react-router-dom";

const Song = React.memo(({ song, style, odd }) => {
  const renderable = useReactifyRichModel(song)

  if (!song) {
    return null
  }

  const coverLocation = (renderable.coverLocation + '') ? '/cover/' + renderable.coverLocation : ''

  return (
    <Link to={"/song/" + song.id} className={['song', odd ? 'odd' : ''].join(' ')} style={style}>
      <div className='cover' style={{
        backgroundImage: `url(${encodeURI(coverLocation)})`
      }}>
      </div>
      <div className='title'>{renderable.title}</div>
      <div>{renderable.displayArtist}</div>
    </Link>
  )
})

Object.defineProperty(Song, 'HEIGHT', {
	get: () => {
		return getUnitInPx() * 3
	}
})

export default Song
