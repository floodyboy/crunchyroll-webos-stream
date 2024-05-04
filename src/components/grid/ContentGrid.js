
import { useCallback, useState, useEffect, useMemo } from 'react'
import { Cell, Row, Column } from '@enact/ui/Layout'
import Heading from '@enact/moonstone/Heading'
import Input from '@enact/moonstone/Input'
import Spinner from '@enact/moonstone/Spinner'
import PropTypes from 'prop-types'

import { useSetRecoilState } from 'recoil'

import { homeViewReadyState } from '../../recoilConfig'
import { $L } from '../../hooks/language'
import CategoryList from './CategoryList'
import ContentGridItems from './ContentGridItems'
import api from '../../api'
import useMergeContentList from '../../hooks/mergeContentList'
import css from './ContentGrid.module.less'


/**
 * @todo keep search after navegate?
 * All content grid and search
 * @param {Object} obj
 * @param {Object} obj.profile current profile
 * @param {String} obj.contentKey key to identify and reload view
 * @param {String} obj.title title for view
 * @param {String} obj.contentType type of content to show, series, movies, etc
 * @param {String} obj.engine Engine to search, can be search or browse
 * @param {Boolean} obj.noCategory Not show category
 * @param {Boolean} obj.noSearch Not show input
 */
const ContentGrid = ({ profile, contentKey, title, contentType, engine, noCategory, noSearch, ...rest }) => {
    /** @type {Function} */
    const setHomeViewReady = useSetRecoilState(homeViewReadyState)
    /** @type {[Array<Object>, Function]} */
    const [contentList, setContentList] = useState([])
    /** @type {[Number, Function]} */
    const [delay, setDelay] = useState(-1)
    /** @type {[String, Function]} */
    const [category, setCategory] = useState('all')
    /** @type {[String, Function]} */
    const [query, setQuery] = useState('')
    /** @type {[import('./SeasonButtons').Season, Function]} */
    const [season, setSeason] = useState(undefined)
    /** @type {[Boolean, Function]}  */
    const [loading, setLoading] = useState(true)
    /** @type {String} */
    const sort = useMemo(() => query === '' ? 'popularity' : 'alphabetical', [query])

    const options = useMemo(() => {
        return {
            quantity: 20,
            ratings: true,
            noMock: true,
            type: contentType,
            contentKey,
            category: category !== 'all' ? [category] : [],
            seasonTag: season ? season.id : undefined,
            sort,
            query,
        }
    }, [category, season, contentType, sort, query, contentKey])

    const onSearch = useCallback(({ value }) => {
        setDelay(2 * 1000)  // 2 seconds
        setQuery(value)
    }, [setQuery, setDelay])

    const mergeContentList = useMergeContentList(setContentList, options.quantity)

    const onLoad = useCallback((index) => {
        if (index % options.quantity === 0) {
            if (contentList[index] === undefined) {
                mergeContentList(false, index)
                if (engine === 'search') {
                    api.discover.search(profile, { ...options, start: index })
                        .then(res => mergeContentList(res.data[0].items, index))
                } else {
                    api.discover.getBrowseAll(profile, { ...options, start: index })
                        .then(res => mergeContentList(res.data, index))
                }
            }
        }
    }, [engine, options, profile, contentList, mergeContentList])

    const changeContentList = useCallback((newList) => {
        setContentList(newList)
        setLoading(false)
        setHomeViewReady(true)
    }, [setContentList, setHomeViewReady, setLoading])

    useEffect(() => {
        let delayDebounceFn = undefined
        if (delay >= 0) {
            delayDebounceFn = setTimeout(() => {
                setLoading(true)
                if (engine === 'search') {
                    if (options.query !== '') {
                        api.discover.search(profile, options).then(res => {
                            changeContentList([
                                ...res.data[0].items,
                                ...new Array(res.data[0].count - res.data[0].items.length)
                            ])
                        })
                    } else {
                        changeContentList([])
                    }
                } else {
                    api.discover.getBrowseAll(profile, options).then(res => {
                        changeContentList([
                            ...res.data,
                            ...new Array(res.total - res.data.length)
                        ])
                    })
                }
            }, delay)
        }
        return () => clearTimeout(delayDebounceFn)
    }, [profile, contentKey, delay, options, engine, changeContentList, setLoading])

    useEffect(() => {  // initializing
        setDelay(0)
        return () => {
            setDelay(-1)
            setSeason(undefined)
            setQuery('')
            setCategory('all')
            setContentList([])
        }
    }, [profile, contentKey])

    return (
        <Row className={css.ContentGrid} {...rest}>
            <Column>
                <Cell shrink>
                    <Row>
                        <Cell shrink>
                            <Heading>
                                {title} {season && season.localization.title}
                            </Heading>
                        </Cell>
                        {!noSearch &&
                            <Cell shrink>
                                <Input placeholder={$L('Search')}
                                    value={query}
                                    onChange={onSearch}
                                    iconAfter="search" />
                            </Cell>
                        }
                    </Row>
                </Cell>
                <Cell grow>
                    <Row className={css.scrollerContainer}>
                        {!noCategory &&
                            <Cell size="20%">
                                <CategoryList
                                    category={category}
                                    setCategory={setCategory}
                                    setDelay={setDelay} />
                            </Cell>
                        }
                        <Cell grow >
                            {loading &&
                                <Column align='center center'>
                                    <Spinner />
                                </Column>
                            }
                            {!loading &&
                                <ContentGridItems
                                    contentList={contentList}
                                    load={onLoad} />
                            }
                        </Cell>
                    </Row>
                </Cell>
            </Column>
        </Row>
    )
}

ContentGrid.propTypes = {
    profile: PropTypes.object.isRequired,
    contentKey: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    contentType: PropTypes.string,
    engine: PropTypes.string,
    noCategory: PropTypes.bool
}

ContentGrid.defaultProps = {
    engine: 'browse'
}

export default ContentGrid
