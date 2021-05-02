let unitInPx
export const UNIT_SCALE = 1.2
export const getUnitInPx = () => {
	if (unitInPx) {
		return unitInPx
	}

	const div = document.createElement('div')
	div.style.border = 'none'
	div.style.padding = '0'
	div.style.margin = '0'
	div.style.width = UNIT_SCALE + 'rem'
	document.body.appendChild(div)
	unitInPx = div.offsetWidth
	document.body.removeChild(div)

	return unitInPx
}