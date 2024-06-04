
import { useEffect, useCallback, useRef } from 'react'
import { Row, Cell } from '@enact/ui/Layout'
import ri from '@enact/ui/resolution'
import Marquee from '@enact/moonstone/Marquee'
import VirtualList from '@enact/moonstone/VirtualList'

import PropTypes from 'prop-types'

import { $L } from '../../hooks/language'
import withNavigable from '../../hooks/navigable'
import css from './ContentDetail.module.less'


const NavigableDiv = withNavigable('div')

/**
 * Render an item
 * @param {Object} obj
 * @param {Number} obj.index
 * @param {Number} obj.itemHeight
 * @param {Array<Object>} obj.seasons
 */
const renderItem = ({ index, itemHeight: height, seasons, ...rest }) => {
    return (
        <NavigableDiv {...rest} key={index} style={{ height }}>
            <Row>
                {seasons[index].season_sequence_number &&
                    <Cell shrink>
                        {seasons[index].season_sequence_number}
                    </Cell>
                }
                <Cell className={css.name}>
                    <Marquee marqueeOn='render'>
                        {seasons[index].title}
                    </Marquee>
                </Cell>
                {seasons[index].number_of_episodes &&
                    <Cell shrink>
                        {`${seasons[index].number_of_episodes} ${$L('Episodes')}`}
                    </Cell>
                }
            </Row>
        </NavigableDiv>
    )
}

/**
 * @param {Object} obj
 * @param {Array<Object>} obj.seasons
 * @param {Function} obj.selectEpisode
 */
const SeasonsList = ({ seasons, selectSeason, ...rest }) => {
    /** @type {{current: Function}} */
    const scrollToRef = useRef(null)
    /** @type {Function} */
    const getScrollTo = useCallback((scrollTo) => { scrollToRef.current = scrollTo }, [])
    const itemHeight = ri.scale(70)

    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollToRef.current && seasons.length > 0) {
                clearInterval(interval)
                scrollToRef.current({ index: 0, animate: false, focus: true })
            }
        }, 100)
        return () => clearInterval(interval)
    }, [seasons])

    return (
        <VirtualList
            {...rest}
            className={css.firstData}
            dataSize={seasons.length}
            itemRenderer={renderItem}
            itemSize={itemHeight}
            cbScrollTo={getScrollTo}
            direction='vertical'
            verticalScrollbar='hidden'
            childProps={{
                onFocus: selectSeason,
                itemHeight,
                seasons,
            }}
        />
    )
}

SeasonsList.propTypes = {
    seasons: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectSeason: PropTypes.func.isRequired,
}

export default SeasonsList
