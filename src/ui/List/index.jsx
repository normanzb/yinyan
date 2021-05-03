import React from 'react'
import Song from '../Song'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import './styles.less'

// can use this
// https://react-table.tanstack.com/docs/examples/virtualized-rows

export default ({ playlist }) => {
  if (!playlist) {
    return null
  }
  const songs = playlist.songs

  return (
    <div className='list'>
      <AutoSizer>
        {({ height, width}) => (
          <FixedSizeList
            height={height} width={width}
            itemCount={songs.length}
            itemSize={Song.HEIGHT}
          >
            {({index, style}) => {
              const song = songs[index]
              return <Song key={index} odd={index % 2 === 1} song={song} style={style} />
            }}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
	)
}
