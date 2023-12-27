
import { useEffect, useCallback, useState, useMemo } from 'react'
import { Row, Cell } from '@enact/ui/Layout'
import Spotlight from '@enact/spotlight'

import Heading from '@enact/moonstone/Heading'
import BodyText from '@enact/moonstone/BodyText'
import Item from '@enact/moonstone/Item'
import Icon from '@enact/moonstone/Icon'
import IconButton from '@enact/moonstone/IconButton'
import $L from '@enact/i18n/$L'
import PropTypes from 'prop-types'

import Scroller from '../../patch/Scroller'
import { ContentHeader } from '../home/ContentBanner'
import api from '../../api'
import back from '../../back'
import css from './ContentDetail.module.less'


const useChangeActivity = (setIndex, index) => {
    return () => {
        back.pushHistory({ doBack: () => { setIndex(0) } })
        setIndex(index)
    }
}

/**
 * Compute titles
 * @param {{
    content: Object,
    nextContent: Object,
 }}
 * @returns {{watch: String, description: String, subtitle: String, moreDetail: String}}
 */
const computeTitles = ({ content, nextContent }) => {
    let subtitle = '', description = content.description || '', watch = $L('Watch')
    let moreDetail = ''

    if (nextContent) {
        if (nextContent.type === 'episode') {
            const season = nextContent.episode_metadata.season_number || 0
            const episodeNumber = nextContent.episode_metadata.episode_number || 0
            description = nextContent.description
            watch = `${$L('Watch')} ${$L('Season')} ${season}: ${$L('E')} ${episodeNumber}`
            subtitle = `${$L('Episode')} ${episodeNumber}: ${nextContent.title}`
        } else if (nextContent.type === 'movie') {
            description = nextContent.description
            watch = `${$L('Watch')} ${nextContent.title}`
            subtitle = nextContent.title
        }
    }
    if (content.type === 'series') {
        moreDetail = $L('Episodes and more')
    } else if (content.type === 'movie_listing') {
        moreDetail = $L('Movies and more')
    }
    return { watch, description, subtitle, moreDetail }
}

/**
 * @param {{
    profile: Object,
    content: Object,
    rating: Number,
    updateRating: Function,
    setIndex: Function,
    setContentToPlay: Function,
 }}
 */
const Options = ({ profile, content, rating, updateRating, setIndex, setContentToPlay, ...rest }) => {

    /** @type {[Object, Function]} */
    const [nextContent, setNextConent] = useState(null)
    /** @type {[Object, Function]} */
    const [isInWatchlist, setIsInWatchlist] = useState(false)
    /** @type {{watch: String, description: String, subtitle: String, moreDetail: String}} */
    const { watch, description, subtitle, moreDetail } = useMemo(() => {
        return computeTitles({ content, nextContent })
    }, [content, nextContent])
    /** @type {Function} */
    const moreEpisodes = useChangeActivity(setIndex, 1)
    /** @type {Function} */
    const changeSubs = useChangeActivity(setIndex, 2)
    /** @type {Function} */
    const playNextContent = useCallback(() => {
        setContentToPlay(nextContent)
    }, [setContentToPlay, nextContent])

    /** @type {Function} */
    const toggleWatchlist = useCallback(async () => {
        if (isInWatchlist) {
            api.content.deleteWatchlistItem(profile, { contentId: content.id })
        } else {
            api.content.addWatchlistItem(profile, { contentId: content.id })
        }
        setIsInWatchlist(prev => !prev)
    }, [profile, content, isInWatchlist, setIsInWatchlist])


    useEffect(() => {
        /**
         * @bug if there is not a next Ep?
         */
        api.discover.getNext(profile, {
            contentId: content.id,
            contentType: content.type
        }).then(nextEp => {
            if (nextEp && nextEp.total > 0) {
                if (nextEp.data[0].type === 'movie') {
                    setNextConent({ ...nextEp.data[0], ...nextEp.data[0].panel, panel: null })
                } else {
                    setNextConent(nextEp.data[0])
                }
            }
        })
        if (['series', 'movie_listing'].includes(content.type)) {
            api.content.getWatchlistItems(profile, { contentIds: [content.id] }).then(res => {
                setIsInWatchlist(res.total > 0)
            })
        }
    }, [profile, content])

    useEffect(() => {
        Spotlight.focus('#play')
    }, [])

    return (
        <Row {...rest}>
            <Cell size='49%'>
                <ContentHeader content={content} />
                {subtitle &&
                    <Heading size='small' spacing='small' className={css.firstData}>
                        {subtitle}
                    </Heading>
                }
                <div className={css.scrollerContainer}>
                    <Scroller direction='vertical' horizontalScrollbar='hidden'
                        verticalScrollbar='auto'>
                        <BodyText size='small'>
                            {description}
                        </BodyText>
                    </Scroller>
                </div>
                <BodyText component='div' size='small'>
                    {Array.from({ length: 5 }, (_v, i) =>
                        <IconButton size='small' key={i} data-star={i}
                            onClick={updateRating}>
                            {(i < rating) ? 'star' : 'hollowstar'}
                        </IconButton>
                    )}
                </BodyText>
                <div className={css.scrollerContainer}>
                    <Scroller direction='vertical' horizontalScrollbar='hidden'
                        verticalScrollbar='visible'>
                        <Item id='play' onClick={playNextContent}>
                            <Icon>play</Icon>
                            <span>{watch}</span>
                        </Item>
                        <Item onClick={moreEpisodes}>
                            <Icon>series</Icon>
                            <span>{moreDetail}</span>
                        </Item>
                        <Item onClick={changeSubs}>
                            <Icon>audio</Icon>
                            <span>{$L('Audio and Subtitles')}</span>
                        </Item>
                        {['series', 'movie_listing'].includes(content.type) && (
                            <Item onClick={toggleWatchlist}>
                                <Icon>{isInWatchlist ? 'closex' : 'plus'}</Icon>
                                <span>{isInWatchlist ? $L('Remove from my list') : $L('Add to my list')}</span>
                            </Item>
                        )}
                    </Scroller>
                </div>
            </Cell>
        </Row>
    )
}

Options.propTypes = {
    profile: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    rating: PropTypes.number.isRequired,
    updateRating: PropTypes.func.isRequired,
    setIndex: PropTypes.func.isRequired,
    setContentToPlay: PropTypes.func.isRequired,
}

export default Options
