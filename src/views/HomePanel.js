import { useEffect, useState, useCallback } from 'react'
import { Row, Cell } from '@enact/ui/Layout'
import Transition from '@enact/ui/Transition'
import { Panel } from '@enact/moonstone/Panels'

import { useRecoilValue } from 'recoil'

import { currentProfileState } from '../recoilConfig'
import HomeToolbar, { TOOLBAR_INDEX } from '../components/HomeToolbar'
import HomeFeed from '../components/HomeFeed'
import FloatingLayerFix from '../patch/FloatingLayer'
import api from '../api'


const ActivityViews = ({ index, children }) => (children[index])

const HomePanel = (props) => {
    /** @type {import('crunchyroll-js-api/src/types').Profile}*/
    const profile = useRecoilValue(currentProfileState)
    /** @type {[Array<Object>, Function]} */
    const [homefeed, setHomefeed] = useState([])
    /** @type {[number, Function]} */
    const [currentActivity, setCurrentActivity] = useState(TOOLBAR_INDEX.home.index)
    /** @type {[Array<Object>, Function]} */
    const [showFullToolbar, setShowFullToolbar] = useState(false)
    /** @type {Function} */
    const toggleShowFullToolbar = useCallback(() => {
        setShowFullToolbar(val => !val)
    }, [setShowFullToolbar])
    /** @type {Function} */
    const setActivity = useCallback((ev) => {
        setShowFullToolbar(false)
        setCurrentActivity(parseInt(ev.currentTarget.dataset.index))
    }, [setCurrentActivity, setShowFullToolbar])

    useEffect(() => {
        const loadData = async () => {
            const { data } = await api.getHomeFeed(profile)
            setHomefeed(data.filter(item => item.response_type !== 'news_feed'))
        }
        loadData()
    }, [profile])

    return (
        <Panel {...props}>
            <Row style={{ height: '100%' }}>
                <Cell shrink>
                    <HomeToolbar currentIndex={currentActivity}
                        onClick={toggleShowFullToolbar} hideText />
                </Cell>
                <Cell grow>
                    <ActivityViews index={currentActivity} noCloseButton>
                        <HomeFeed profile={profile} homefeed={homefeed} />
                        <p>search</p>
                        <p>series</p>
                        <p>movies</p>
                        <p>categories</p>
                        <p>listo</p>
                    </ActivityViews>
                </Cell>
            </Row>
            <Transition visible={showFullToolbar} type='slide' direction='right'>
                <FloatingLayerFix open={showFullToolbar} onDismiss={toggleShowFullToolbar}
                    style={{
                        background: 'linear-gradient(to right, #000000 20%, rgba(0, 0, 0, 0))',
                        paddingLeft: '2rem',
                    }}>
                    <HomeToolbar currentIndex={currentActivity}
                        onClick={setActivity} autoFocus />
                </FloatingLayerFix>
            </Transition>
        </Panel>
    )
}

export default HomePanel
