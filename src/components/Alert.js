
import { forwardRef, useRef, useEffect } from 'react'
import Spotlight from '@enact/spotlight'
import { SpotlightContainerDecorator } from '@enact/spotlight/SpotlightContainerDecorator'
import { Row } from '@enact/ui/Layout'
import { Column } from '@enact/ui/Layout'
import FloatingLayer from '@enact/ui/FloatingLayer'
import Skinnable from '@enact/moonstone/Skinnable'
import Heading from '@enact/moonstone/Heading'
import Button from '@enact/moonstone/Button'
import $L from '@enact/i18n/$L'
import PropTypes from 'prop-types'

import css from './Alert.module.less'


export const AlertBase = ({ open, title, message, onCancel, onAccept, forwardedRef, ...rest }) => {

    /** @type {{current: HTMLElement}} */
    const compRef = useRef(null)

    useEffect(() => {
        const interlval = setInterval(() => {
            if (compRef.current) {
                clearInterval(interlval)
                Spotlight.focus(compRef.current.children[0])
            }
            return () => clearInterval(interlval)
        }, 100)
    }, [])


    return (
        <FloatingLayer className={css.Alert} open={open} noAutoDismiss>
            <Column style={{ height: 'auto' }} {...rest} className={css.content} ref={forwardedRef}>
                {title && <Heading size='medium'>{title}</Heading>}
                {message && <Heading size="small">{message}</Heading>}
                <Row align='baseline flex-end' ref={compRef}>
                    {onCancel && <Button onClick={onCancel}>{$L('Cancel')}</Button>}
                    <Button onClick={onAccept}>{$L('Accept')}</Button>
                </Row>
            </Column>
        </FloatingLayer >
    )
}

export const AlertSpot = SpotlightContainerDecorator(AlertBase)
export const AlertSkin = Skinnable({ defaultSkin: 'light' }, AlertSpot)
const Alert = forwardRef((props, ref) => (<AlertSkin {...props} forwardedRef={ref} />))

Alert.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    onCancel: PropTypes.func,
    onAccept: PropTypes.func.isRequired,
}

export default Alert
